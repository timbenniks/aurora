import { getInstallationAccessToken } from "@/lib/github/app-auth"
import { GitHubApiError } from "@/lib/github/client"
import {
  getInstallationAccount,
  type InstallationAccount,
} from "@/lib/github/installation"

export type RepoAccessTokens = {
  account: InstallationAccount
  primary: string
  fallback?: string
}

/** Tokens for repo contents, issues, and labels on an existing repository. */
export async function resolveRepoAccessTokens(
  installationId: number,
  githubLogin: string,
  userAccessToken?: string
): Promise<RepoAccessTokens> {
  const account = await getInstallationAccount(installationId)
  const installationToken = await getInstallationAccessToken(installationId)

  if (account.type === "Organization") {
    return {
      account,
      primary: installationToken,
    }
  }

  if (!userAccessToken) {
    throw new GitHubApiError(
      "Sign out and sign in again to authorize repository access.",
      403,
      { code: "missing_user_token" }
    )
  }

  return {
    account,
    primary: userAccessToken,
    fallback: installationToken,
  }
}

export function resolveRepoOwner(
  account: InstallationAccount,
  githubLogin: string,
  repoOwner: string
): string {
  if (account.type === "Organization") {
    return repoOwner
  }

  return githubLogin || repoOwner
}

/** @deprecated Use resolveRepoAccessTokens */
export async function resolveRepoToken(
  installationId: number,
  userAccessToken?: string
): Promise<string> {
  const { primary } = await resolveRepoAccessTokens(
    installationId,
    "",
    userAccessToken
  )
  return primary
}
