import { githubApiRequest } from "@/lib/github/client"
import { getInstallationAccessToken } from "@/lib/github/app-auth"

export type InstallationRepository = {
  id: number
  owner: string
  name: string
  fullName: string
  url: string
  defaultBranch: string
  private: boolean
}

type InstallationRepositoriesResponse = {
  repositories: Array<{
    id: number
    name: string
    full_name: string
    html_url: string
    private: boolean
    default_branch?: string | null
    owner: { login: string }
  }>
}

export async function listInstallationRepositories(
  installationId: number
): Promise<InstallationRepository[]> {
  const token = await getInstallationAccessToken(installationId)
  const repositories: InstallationRepository[] = []
  let page = 1

  while (page <= 10) {
    const response = await githubApiRequest<InstallationRepositoriesResponse>(
      `/installation/repositories?per_page=100&page=${page}`,
      token
    )

    for (const repo of response.repositories) {
      repositories.push({
        id: repo.id,
        owner: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        defaultBranch: repo.default_branch ?? "main",
        private: repo.private,
      })
    }

    if (response.repositories.length < 100) {
      break
    }

    page += 1
  }

  return repositories.sort((left, right) =>
    left.fullName.localeCompare(right.fullName)
  )
}
