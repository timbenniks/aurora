import { getGitHubAppJwt } from "@/lib/github/app-auth"
import { GITHUB_API_HEADERS, githubApiRequest } from "@/lib/github/client"
import { getGitHubAppSlug } from "@/lib/github/env"

export type InstallationAccount = {
  login: string
  type: "User" | "Organization"
}

type InstallationResponse = {
  id: number
  account: InstallationAccount | null
}

export function getGitHubAppInstallUrl(): string {
  const slug = getGitHubAppSlug()
  return `https://github.com/apps/${slug}/installations/new`
}

export async function verifyGitHubInstallation(
  installationId: number
): Promise<boolean> {
  const token = await getGitHubAppJwt()

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: {
        ...GITHUB_API_HEADERS,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  )

  return response.ok
}

export async function getInstallationAccount(
  installationId: number
): Promise<InstallationAccount> {
  const token = await getGitHubAppJwt()
  const installation = await githubApiRequest<InstallationResponse>(
    `/app/installations/${installationId}`,
    token
  )

  if (!installation.account?.login) {
    throw new Error("GitHub installation account is missing")
  }

  return installation.account
}
