import { NextResponse } from "next/server"
import { z } from "zod"

import { getWorkspaceForUser } from "@/lib/aurora/workspaces"
import { launchAgentForTask } from "@/lib/cursor/launch-agent"
import { requireSessionUser } from "@/lib/auth/session-user"

const bodySchema = z.object({
  taskId: z.string().uuid(),
})

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

  const { id: workspaceId } = await context.params

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 })
  }

  const workspace = await getWorkspaceForUser(
    workspaceId,
    sessionUser.githubUserId
  )

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found.", code: "not_found" },
      { status: 404 }
    )
  }

  const result = await launchAgentForTask({
    workspaceId,
    taskId: parsed.data.taskId,
    githubUserId: sessionUser.githubUserId,
  })

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "cursor_not_connected"
          ? 422
          : result.code === "already_launched"
            ? 409
            : 400

    return NextResponse.json(
      { error: result.error, code: result.code },
      { status }
    )
  }

  return NextResponse.json({
    ok: true,
    agentId: result.agentId,
    runId: result.runId,
    runStatus: result.runStatus,
    agentUrl: result.agentUrl,
  })
}
