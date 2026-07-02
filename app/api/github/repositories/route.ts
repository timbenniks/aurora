import { NextResponse } from "next/server"

import { listLinkedGithubRepoIds } from "@/lib/aurora/workspaces"
import { requireGitHubSession } from "@/lib/auth/github-session"
import { requireSessionUser } from "@/lib/auth/session-user"
import { listInstallationRepositories } from "@/lib/github/list-repositories"

export async function GET() {
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

  try {
    const [repositories, linkedRepoIds] = await Promise.all([
      listInstallationRepositories(session.installationId),
      listLinkedGithubRepoIds(sessionUser.githubUserId),
    ])

    return NextResponse.json({
      repositories: repositories.map((repository) => ({
        ...repository,
        isLinked: linkedRepoIds.has(repository.id),
      })),
    })
  } catch (error) {
    console.error("List repositories failed:", error)

    return NextResponse.json(
      { error: "Could not load repositories.", code: "github_error" },
      { status: 500 }
    )
  }
}
