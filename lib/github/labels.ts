import { GitHubApiError, githubApiRequest } from "@/lib/github/client"
import { isDuplicateGitHubResource } from "@/lib/github/github-errors"

const DEFAULT_LABEL_COLOR = "6e7681"
const MAX_LABEL_NAME_LENGTH = 50
const LABEL_NAME_PATTERN = /^[a-zA-Z0-9:_-]+$/

const LABEL_COLORS: Record<string, string> = {
  aurora: "6f42c1",
  "aurora:agent-task": "8250df",
  "aurora:in-progress": "0969da",
  "aurora:blocked": "cf222e",
  "aurora:needs-human": "bf8700",
  "aurora:ready-for-agent": "1a7f37",
  "agent:cursor": "0e8a16",
  "risk:low": "1a7f37",
  "risk:medium": "bf8700",
  "risk:high": "cf222e",
  "priority:low": "6e7681",
  "priority:medium": "0969da",
  "priority:high": "cf222e",
  "type:setup": "8250df",
  "type:implementation": "0969da",
  "type:docs": "6e7681",
  "type:validation": "1a7f37",
  "type:research": "bf8700",
  "type:refactor": "8250df",
}

function labelColor(name: string): string {
  return (LABEL_COLORS[name] ?? DEFAULT_LABEL_COLOR).toLowerCase()
}

function isValidLabelName(name: string): boolean {
  return (
    name.length > 0 &&
    name.length <= MAX_LABEL_NAME_LENGTH &&
    LABEL_NAME_PATTERN.test(name)
  )
}

async function listExistingLabelNames(
  owner: string,
  repo: string,
  token: string
): Promise<Set<string>> {
  const labels = await githubApiRequest<Array<{ name: string }>>(
    `/repos/${owner}/${repo}/labels?per_page=100`,
    token
  )

  return new Set(labels.map((label) => label.name.toLowerCase()))
}

export async function createLabels(
  owner: string,
  repo: string,
  labels: string[],
  token: string
): Promise<{ created: number; skipped: number; invalid: number }> {
  const unique = [...new Set(labels.map((label) => label.trim()).filter(Boolean))]
  const existing = await listExistingLabelNames(owner, repo, token)
  let created = 0
  let skipped = 0
  let invalid = 0

  for (const name of unique) {
    if (!isValidLabelName(name)) {
      invalid += 1
      continue
    }

    if (existing.has(name.toLowerCase())) {
      skipped += 1
      continue
    }

    try {
      await githubApiRequest(`/repos/${owner}/${repo}/labels`, token, {
        method: "POST",
        body: JSON.stringify({
          name,
          color: labelColor(name),
        }),
      })
      existing.add(name.toLowerCase())
      created += 1
    } catch (error) {
      if (error instanceof GitHubApiError && isDuplicateGitHubResource(error)) {
        skipped += 1
        continue
      }

      throw error
    }
  }

  return { created, skipped, invalid }
}
