import { NextResponse } from "next/server"

import { listWorkspacesForUser } from "@/lib/aurora/workspaces"
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
    const workspaces = await listWorkspacesForUser(sessionUser.githubUserId)

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error("List workspaces failed:", error)

    return NextResponse.json(
      { error: "Could not load workspaces.", code: "db_error" },
      { status: 500 }
    )
  }
}
