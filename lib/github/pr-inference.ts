export function extractIssueNumberFromBranch(branch: string): number | null {
  const patterns = [
    /issue[-_]?(\d+)/i,
    /task[-_]?(\d+)/i,
    /cursor\/[^/]*?(\d+)/i,
    /aurora[-_]?(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = branch.match(pattern)

    if (match?.[1]) {
      return Number(match[1])
    }
  }

  return null
}

export function extractIssueNumberFromBody(body: string | null | undefined): number | null {
  if (!body) {
    return null
  }

  const patterns = [
    /(?:closes|fixes|resolves)\s+#(\d+)/i,
    /issue\s*#(\d+)/i,
    /aurora:issue\s*(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = body.match(pattern)

    if (match?.[1]) {
      return Number(match[1])
    }
  }

  return null
}

export function inferPullRequestMetadata(input: {
  branch: string
  body?: string | null
  labels?: string[]
  draft?: boolean
}): {
  sourceIssueNumber: number | null
  bugbotStatus: string | null
  approvalStatus: string | null
  humanReviewRequired: boolean
} {
  const labels = input.labels ?? []
  const normalized = labels.map((label) => label.toLowerCase())

  const sourceIssueNumber =
    extractIssueNumberFromBranch(input.branch) ??
    extractIssueNumberFromBody(input.body)

  let bugbotStatus: string | null = null

  if (normalized.some((label) => label.includes("bugbot:fail"))) {
    bugbotStatus = "failed"
  } else if (normalized.some((label) => label.includes("bugbot:clean"))) {
    bugbotStatus = "clean"
  }

  let approvalStatus: string | null = null

  if (normalized.some((label) => label.includes("approved"))) {
    approvalStatus = "approved"
  } else if (
    normalized.some((label) => label.includes("changes_requested") || label.includes("blocked"))
  ) {
    approvalStatus = "changes_requested"
  }

  const humanReviewRequired =
    input.draft === true ||
    normalized.some(
      (label) =>
        label.includes("human-review") ||
        label.includes("aurora:human-review") ||
        label.includes("needs-review")
    )

  return {
    sourceIssueNumber,
    bugbotStatus,
    approvalStatus,
    humanReviewRequired,
  }
}

export function isAgentPullRequest(branch: string, labels: string[]): boolean {
  if (branch.toLowerCase().includes("cursor/")) {
    return true
  }

  return labels.some((label) => label.toLowerCase().startsWith("aurora:"))
}
