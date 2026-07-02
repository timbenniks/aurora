import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { verifyGitHubInstallation } from "@/lib/github/installation"

const bodySchema = z.object({
  installationId: z.number().int().positive(),
})

function publicErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Could not verify GitHub App installation"
  }

  if (error.message.includes("GITHUB_APP_PRIVATE_KEY")) {
    return error.message
  }

  if (error.message.includes("privateKey")) {
    return (
      "GitHub App private key is invalid or incomplete in .env.local. " +
      "Use a full PEM on one line with \\n escapes, or set GITHUB_APP_PRIVATE_KEY_PATH."
    )
  }

  return "Could not verify GitHub App installation"
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "installationId must be a positive integer" },
      { status: 400 }
    )
  }

  try {
    const valid = await verifyGitHubInstallation(parsed.data.installationId)

    if (!valid) {
      return NextResponse.json(
        { error: "Installation not found for this GitHub App" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      installationId: String(parsed.data.installationId),
    })
  } catch (error) {
    console.error("GitHub installation verify failed:", error)

    return NextResponse.json(
      { error: publicErrorMessage(error) },
      { status: 500 }
    )
  }
}
