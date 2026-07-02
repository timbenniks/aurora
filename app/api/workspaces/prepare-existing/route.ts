import { NextResponse } from "next/server"
import { z } from "zod"

import { getGitHubAccessToken } from "@/lib/auth/github-access-token"
import { requireGitHubSession } from "@/lib/auth/github-session"
import { requireSessionUser } from "@/lib/auth/session-user"
import { runPrepareExistingRepository } from "@/lib/workspaces/prepare-existing-repository"

const bodySchema = z.object({
  launch_brief: z.unknown(),
  owner: z.string().min(1),
  repo: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await requireGitHubSession()

  if ("error" in session) {
    return NextResponse.json(
      { error: session.error, code: session.code },
      { status: session.status }
    )
  }

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
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "launch_brief, owner, and repo are required." },
      { status: 400 }
    )
  }

  const userAccessToken = await getGitHubAccessToken(request)

  const result = await runPrepareExistingRepository(
    parsed.data.launch_brief,
    session.installationId,
    session.githubLogin,
    userAccessToken,
    parsed.data.owner,
    parsed.data.repo,
    sessionUser
  )

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status }
    )
  }

  return NextResponse.json({
    workspaceId: result.workspaceId,
    repo: result.repo,
    scan: result.scan,
    pullRequest: result.pullRequest,
    filesInPullRequest: result.filesInPullRequest,
    alreadyLinked: result.alreadyLinked,
  })
}
