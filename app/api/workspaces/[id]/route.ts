import { NextResponse } from "next/server"

import { deleteWorkspaceForUser, getWorkspaceForUser } from "@/lib/aurora/workspaces"
import { getGitHubAccessToken } from "@/lib/auth/github-access-token"
import { requireSessionUser } from "@/lib/auth/session-user"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const sessionUser = await requireSessionUser()

  if ("error" in sessionUser) {
    return NextResponse.json(
      { error: sessionUser.error, code: sessionUser.code },
      { status: sessionUser.status }
    )
  }

  const { id } = await context.params

  try {
    const workspace = await getWorkspaceForUser(id, sessionUser.githubUserId)

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found.", code: "not_found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error("Get workspace failed:", error)

    return NextResponse.json(
      { error: "Could not load workspace.", code: "db_error" },
      { status: 500 }
    )
  }
}

type DeleteWorkspaceBody = {
  confirmName?: string
}

export async function DELETE(request: Request, context: RouteContext) {
  const sessionUser = await requireSessionUser()

  if ("error" in sessionUser) {
    return NextResponse.json(
      { error: sessionUser.error, code: sessionUser.code },
      { status: sessionUser.status }
    )
  }

  const { id } = await context.params

  let body: DeleteWorkspaceBody

  try {
    body = (await request.json()) as DeleteWorkspaceBody
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    )
  }

  if (!body.confirmName?.trim()) {
    return NextResponse.json(
      { error: "confirmName is required.", code: "confirm_name_required" },
      { status: 422 }
    )
  }

  const userAccessToken = await getGitHubAccessToken(request)

  try {
    const result = await deleteWorkspaceForUser({
      workspaceId: id,
      githubUserId: sessionUser.githubUserId,
      githubLogin: sessionUser.githubLogin,
      confirmName: body.confirmName,
      userAccessToken,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete workspace failed:", error)

    return NextResponse.json(
      { error: "Could not delete workspace.", code: "db_error" },
      { status: 500 }
    )
  }
}
