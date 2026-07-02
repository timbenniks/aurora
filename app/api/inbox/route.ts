import { NextResponse } from "next/server"

import { getInboxForUser } from "@/lib/aurora/inbox"
import { requireSessionUser } from "@/lib/auth/session-user"

export async function GET() {
  const sessionUser = await requireSessionUser()

  if ("error" in sessionUser) {
    return NextResponse.json(
      { error: sessionUser.error, code: sessionUser.code },
      { status: sessionUser.status }
    )
  }

  try {
    const inbox = await getInboxForUser(sessionUser.githubUserId)

    return NextResponse.json(inbox)
  } catch (error) {
    console.error("Get inbox failed:", error)

    return NextResponse.json(
      { error: "Could not load inbox.", code: "db_error" },
      { status: 500 }
    )
  }
}
