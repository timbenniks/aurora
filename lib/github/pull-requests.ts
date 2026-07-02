import { githubApiRequest } from "@/lib/github/client"

type CreatePullRequestResponse = {
  number: number
  html_url: string
  title: string
}

export type CreatedPullRequest = {
  number: number
  url: string
  title: string
}

export async function createPullRequest(input: {
  owner: string
  repo: string
  title: string
  head: string
  base: string
  body: string
  token: string
}): Promise<CreatedPullRequest> {
  const result = await githubApiRequest<CreatePullRequestResponse>(
    `/repos/${input.owner}/${input.repo}/pulls`,
    input.token,
    {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        head: input.head,
        base: input.base,
        body: input.body,
      }),
    }
  )

  return {
    number: result.number,
    url: result.html_url,
    title: result.title,
  }
}

export function buildSetupPullRequestBody(input: {
  files: string[]
  projectName: string
}): string {
  const fileList = input.files.map((path) => `- \`${path}\``).join("\n")

  return `## Aurora setup

This pull request adds Aurora agent workflow files to **${input.projectName}**.

### Files added

${fileList}

### Next steps

1. Review the generated policy and agent files.
2. Merge when ready.
3. Open Aurora to track readiness and agent tasks.

_Aurora does not auto-merge this PR._
`
}
