import { NextResponse } from "next/server"
import { z } from "zod"

import { CursorApiError } from "@/lib/cursor/errors"
import {
  getCursorConnectionStatus,
  removeCursorApiKey,
  saveCursorApiKey,
} from "@/lib/cursor/credentials"
import { requireSessionUser } from "@/lib/auth/session-user"

const saveSchema = z.object({
  apiKey: z.string().min(1),
  autoLaunchAgent: z.boolean().optional(),
})

export async function GET() {
  const sessionUser = await requireSessionUser()

  if ("error" in sessionUser) {
    return NextResponse.json(
      { error: sessionUser.error, code: sessionUser.code },
      { status: sessionUser.status }
    )
  }

  const status = await getCursorConnectionStatus(sessionUser.githubUserId)

  return NextResponse.json(status)
}

export async function POST(request: Request) {
  const sessionUser = await requireSessionUser()

  if ("error" in sessionUser) {
    return NextResponse.json(
      { error: sessionUser.error, code: sessionUser.code },
      { status: sessionUser.status }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = saveSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 })
  }

  try {
    const status = await saveCursorApiKey({
      githubUserId: sessionUser.githubUserId,
      apiKey: parsed.data.apiKey,
      autoLaunchAgent: parsed.data.autoLaunchAgent,
    })

    return NextResponse.json({ ok: true, ...status })
  } catch (error) {
    if (error instanceof CursorApiError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error("Save Cursor API key failed:", error)

    return NextResponse.json(
      { error: "Could not save Cursor API key." },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const sessionUser = await requireSessionUser()

  if ("error" in sessionUser) {
    return NextResponse.json(
      { error: sessionUser.error, code: sessionUser.code },
      { status: sessionUser.status }
    )
  }

  await removeCursorApiKey(sessionUser.githubUserId)

  return NextResponse.json({ ok: true })
}
