import { NextResponse } from "next/server"

import { getGitHubWebhookSecret } from "@/lib/github/env"
import { recordWebhookDelivery } from "@/lib/github/webhook-dedupe"
import { dispatchGitHubWebhook } from "@/lib/github/webhook-dispatch"
import { verifyGitHubWebhookSignature } from "@/lib/github/webhook-signature"
import { findWorkspaceByGithubRepoId } from "@/lib/github/workspace-index"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const deliveryId = request.headers.get("x-github-delivery")
  const eventName = request.headers.get("x-github-event")
  const signature = request.headers.get("x-hub-signature-256")

  if (!deliveryId || !eventName) {
    return NextResponse.json(
      { error: "Missing GitHub delivery headers." },
      { status: 400 }
    )
  }

  let secret: string

  try {
    secret = getGitHubWebhookSecret()
  } catch {
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 }
    )
  }

  if (!verifyGitHubWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
  }

  let payload: unknown

  try {
    payload = JSON.parse(rawBody) as unknown
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  const repository = (payload as { repository?: { id?: number } }).repository
  const workspace = repository?.id
    ? await findWorkspaceByGithubRepoId(repository.id)
    : null

  const dedupe = await recordWebhookDelivery({
    deliveryId,
    eventName,
    payload: rawBody,
    workspaceId: workspace?.id,
  })

  if (dedupe === "duplicate") {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  try {
    const result = await dispatchGitHubWebhook(eventName, payload)

    return NextResponse.json(result)
  } catch (error) {
    console.error("GitHub webhook handler failed:", error)

    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    )
  }
}
