import { AURORA_SETUP_PATHS } from "@/lib/aurora/setup-paths"
import { calculateReadiness, type ReadinessResult } from "@/lib/aurora/readiness"
import { GitHubApiError, githubApiRequest } from "@/lib/github/client"

export type RepositoryScanResult = {
  defaultBranch: string
  existingPaths: string[]
  missingPaths: string[]
  readiness: ReadinessResult
}

function encodeContentPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/")
}

async function pathExists(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  token: string
): Promise<boolean> {
  try {
    await githubApiRequest(
      `/repos/${owner}/${repo}/contents/${encodeContentPath(path)}?ref=${encodeURIComponent(ref)}`,
      token
    )

    return true
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      return false
    }

    throw error
  }
}

export async function scanRepositorySetupFiles(input: {
  owner: string
  repo: string
  defaultBranch: string
  token: string
}): Promise<RepositoryScanResult> {
  const existingPaths: string[] = []
  const missingPaths: string[] = []

  for (const path of AURORA_SETUP_PATHS) {
    const exists = await pathExists(
      input.owner,
      input.repo,
      path,
      input.defaultBranch,
      input.token
    )

    if (exists) {
      existingPaths.push(path)
    } else {
      missingPaths.push(path)
    }
  }

  return {
    defaultBranch: input.defaultBranch,
    existingPaths,
    missingPaths,
    readiness: calculateReadiness(existingPaths),
  }
}
