import { githubApiRequest } from "@/lib/github/client"

type GitRefResponse = {
  object: { sha: string }
}

type CreateRefResponse = {
  ref: string
}

export async function createBranchFromDefault(
  owner: string,
  repo: string,
  defaultBranch: string,
  branchName: string,
  token: string
): Promise<void> {
  const baseRef = await githubApiRequest<GitRefResponse>(
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
    token
  )

  await githubApiRequest<CreateRefResponse>(
    `/repos/${owner}/${repo}/git/refs`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      }),
    }
  )
}

export function createSetupBranchName(): string {
  return `aurora/setup-${Date.now()}`
}
