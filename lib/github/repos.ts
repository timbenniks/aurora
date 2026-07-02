import type { PROJECT_VISIBILITY } from "@/lib/aurora/launch-brief-enums"
import { GitHubApiError } from "@/lib/github/client"
import { getInstallationAccessToken } from "@/lib/github/app-auth"
import { githubApiRequest } from "@/lib/github/client"
import { getInstallationAccount } from "@/lib/github/installation"
import { resolveRepoAccessTokens } from "@/lib/github/token"
import { withRepoToken } from "@/lib/github/with-repo-token"

type GitHubVisibility = (typeof PROJECT_VISIBILITY)[number]

export type CreateRepositoryInput = {
  installationId: number
  name: string
  description: string
  visibility: GitHubVisibility
  defaultBranch: string
  /** Required when the App is installed on a personal GitHub account. */
  userAccessToken?: string
}

export type RepositoryRef = {
  id: number
  owner: string
  name: string
  fullName: string
  url: string
  defaultBranch: string
}

type GitHubRepositoryResponse = {
  id: number
  name: string
  full_name: string
  html_url: string
  default_branch: string | null
  owner: {
    login: string
  }
}

function toRepositoryRef(
  repo: GitHubRepositoryResponse,
  defaultBranch: string
): RepositoryRef {
  return {
    id: repo.id,
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    defaultBranch: repo.default_branch ?? defaultBranch,
  }
}

function createRepositoryBody(input: CreateRepositoryInput) {
  return {
    name: input.name,
    description: input.description,
    private: input.visibility === "private",
    visibility: input.visibility,
    auto_init: true,
    has_issues: true,
    has_projects: false,
    has_wiki: false,
  }
}

export async function createRepository(
  input: CreateRepositoryInput
): Promise<RepositoryRef> {
  const account = await getInstallationAccount(input.installationId)
  const body = JSON.stringify(createRepositoryBody(input))

  let token: string
  let path: string

  if (account.type === "Organization") {
    token = await getInstallationAccessToken(input.installationId)
    path = `/orgs/${account.login}/repos`
  } else {
    if (!input.userAccessToken) {
      throw new GitHubApiError(
        "Sign out and sign in again to authorize repository creation.",
        403,
        { code: "missing_user_token" }
      )
    }

    token = input.userAccessToken
    path = "/user/repos"
  }

  const repo = await githubApiRequest<GitHubRepositoryResponse>(path, token, {
    method: "POST",
    body,
  })

  return toRepositoryRef(repo, input.defaultBranch)
}

export async function ensureRepositoryIssuesEnabled(
  owner: string,
  repo: string,
  token: string
): Promise<void> {
  const settings = await githubApiRequest<{ has_issues?: boolean }>(
    `/repos/${owner}/${repo}`,
    token
  )

  if (settings.has_issues) {
    return
  }

  await githubApiRequest(`/repos/${owner}/${repo}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      has_issues: true,
    }),
  })
}

export async function getRepository(
  installationId: number,
  owner: string,
  name: string
): Promise<RepositoryRef | null> {
  const token = await getInstallationAccessToken(installationId)

  try {
    const repo = await githubApiRequest<GitHubRepositoryResponse>(
      `/repos/${owner}/${name}`,
      token
    )

    return toRepositoryRef(repo, repo.default_branch ?? "main")
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

export async function deleteRepository(input: {
  installationId: number
  owner: string
  name: string
  githubLogin: string
  userAccessToken?: string
}): Promise<void> {
  const access = await resolveRepoAccessTokens(
    input.installationId,
    input.githubLogin,
    input.userAccessToken
  )

  await withRepoToken(
    { primary: access.primary, fallback: access.fallback },
    (token) =>
      githubApiRequest(`/repos/${input.owner}/${input.name}`, token, {
        method: "DELETE",
      })
  )
}
