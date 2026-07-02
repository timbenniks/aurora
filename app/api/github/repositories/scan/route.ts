import { NextResponse } from "next/server"
import { z } from "zod"

import { getGitHubAccessToken } from "@/lib/auth/github-access-token"
import { requireGitHubSession } from "@/lib/auth/github-session"
import { scanRepositorySetupFiles } from "@/lib/github/scan-repository"
import {
  resolveRepoAccessTokens,
  resolveRepoOwner,
} from "@/lib/github/token"

const bodySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  defaultBranch: z.string().min(1).optional(),
})

export async function POST(request: Request) {
  const session = await requireGitHubSession()

  if ("error" in session) {
    return NextResponse.json(
      { error: session.error, code: session.code },
      { status: session.status }
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
      { error: "owner and repo are required." },
      { status: 400 }
    )
  }

  const userAccessToken = await getGitHubAccessToken(request)

  try {
    const access = await resolveRepoAccessTokens(
      session.installationId,
      session.githubLogin,
      userAccessToken
    )
    const owner = resolveRepoOwner(
      access.account,
      session.githubLogin,
      parsed.data.owner
    )

    const scan = await scanRepositorySetupFiles({
      owner,
      repo: parsed.data.repo,
      defaultBranch: parsed.data.defaultBranch ?? "main",
      token: access.primary,
    })

    return NextResponse.json({ scan })
  } catch (error) {
    console.error("Scan repository failed:", error)

    return NextResponse.json(
      { error: "Could not scan repository.", code: "github_error" },
      { status: 500 }
    )
  }
}
