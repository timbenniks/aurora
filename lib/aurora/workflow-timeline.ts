export type WorkflowTimelineItem = {
  id: string
  title: string
  timestamp: string
  kind: "issue" | "pr" | "ci" | "merge"
}

type TaskInput = {
  id: string
  issueNumber: number
  title: string
  createdAt: string
}

type PullRequestInput = {
  id: string
  prNumber: number
  title: string
  state: string
  sourceIssueNumber: number | null
  ciStatus: string | null
  createdAt: string
  updatedAt: string
  mergedAt: string | null
}

export function buildWorkflowTimeline(
  tasks: TaskInput[],
  pullRequests: PullRequestInput[]
): WorkflowTimelineItem[] {
  const items: WorkflowTimelineItem[] = []

  for (const task of tasks) {
    items.push({
      id: `issue-${task.id}`,
      title: `Issue #${task.issueNumber} opened — ${task.title}`,
      timestamp: task.createdAt,
      kind: "issue",
    })
  }

  for (const pull of pullRequests) {
    const issueRef = pull.sourceIssueNumber
      ? ` for issue #${pull.sourceIssueNumber}`
      : ""

    items.push({
      id: `pr-open-${pull.id}`,
      title: `PR #${pull.prNumber} opened${issueRef} — ${pull.title}`,
      timestamp: pull.createdAt,
      kind: "pr",
    })

    if (pull.ciStatus) {
      items.push({
        id: `pr-ci-${pull.id}`,
        title: `PR #${pull.prNumber} checks: ${pull.ciStatus}`,
        timestamp: pull.updatedAt,
        kind: "ci",
      })
    }

    if (pull.state === "merged" && pull.mergedAt) {
      items.push({
        id: `pr-merged-${pull.id}`,
        title: `PR #${pull.prNumber} merged`,
        timestamp: pull.mergedAt,
        kind: "merge",
      })
    }
  }

  return items
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    )
    .slice(0, 12)
}
