import { auth } from "@/auth"

export type GitHubSessionContext = {
  githubLogin: string
  installationId: number
}

export type GitHubSessionError = {
  error: string
  code?: string
  status: 401 | 403
}

export async function requireGitHubSession(): Promise<
  GitHubSessionContext | GitHubSessionError
> {
  const session = await auth()

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 }
  }

  if (!session.githubInstallationId) {
    return {
      error: "GitHub App not installed",
      code: "missing_installation",
      status: 403,
    }
  }

  if (!session.githubLogin) {
    return {
      error: "GitHub login missing from session",
      code: "missing_github_login",
      status: 403,
    }
  }

  const installationId = Number(session.githubInstallationId)

  if (!Number.isInteger(installationId) || installationId <= 0) {
    return {
      error: "Invalid GitHub App installation",
      code: "invalid_installation",
      status: 403,
    }
  }

  return {
    githubLogin: session.githubLogin,
    installationId,
  }
}
