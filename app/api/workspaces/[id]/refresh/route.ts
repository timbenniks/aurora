import { NextResponse } from "next/server"

import { getWorkspaceForUser } from "@/lib/aurora/workspaces"
import { getGitHubAccessToken } from "@/lib/auth/github-access-token"
import { requireSessionUser } from "@/lib/auth/session-user"
import { syncWorkspaceFromGitHub } from "@/lib/github/sync-workspace"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const sessionUser = await requireSessionUser()

  if ("error" in sessionUser) {
    return NextResponse.json(
      { error: sessionUser.error, code: sessionUser.code },
      { status: sessionUser.status }
    )
  }

  const { id } = await context.params
  const userAccessToken = await getGitHubAccessToken(request)

  try {
    const workspace = await getWorkspaceForUser(id, sessionUser.githubUserId)

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found.", code: "not_found" },
        { status: 404 }
      )
    }

    const sync = await syncWorkspaceFromGitHub({
      workspaceId: id,
      githubLogin: sessionUser.githubLogin,
      userAccessToken,
    })

    if (!sync.ok) {
      return NextResponse.json(
        { error: sync.error, code: "sync_failed" },
        { status: 500 }
      )
    }

    const refreshed = await getWorkspaceForUser(id, sessionUser.githubUserId)

    return NextResponse.json({
      ok: true,
      message: "Workspace refreshed from GitHub.",
      workspace: refreshed,
    })
  } catch (error) {
    console.error("Refresh workspace failed:", error)

    return NextResponse.json(
      { error: "Could not refresh workspace.", code: "db_error" },
      { status: 500 }
    )
  }
}
