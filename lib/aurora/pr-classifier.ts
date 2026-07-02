export type InboxBucket = "ready" | "needs_review" | "in_progress"

export type PullRequestStatusInput = {
  state: string
  ciStatus?: string | null
  bugbotStatus?: string | null
  approvalStatus?: string | null
  humanReviewRequired?: boolean | null
  draft?: boolean
}

export function classifyPullRequest(input: PullRequestStatusInput): InboxBucket | null {
  if (input.state !== "open") {
    return null
  }

  if (input.draft) {
    return "in_progress"
  }

  if (
    input.humanReviewRequired === true ||
    input.approvalStatus === "changes_requested" ||
    input.approvalStatus === "blocked"
  ) {
    return "needs_review"
  }

  if (
    input.ciStatus === "failure" ||
    input.ciStatus === "cancelled" ||
    input.bugbotStatus === "failed"
  ) {
    return "needs_review"
  }

  if (input.ciStatus === "pending" || input.ciStatus == null) {
    return "in_progress"
  }

  if (
    input.ciStatus === "success" &&
    (input.approvalStatus === "approved" ||
      input.approvalStatus == null ||
      input.bugbotStatus === "clean" ||
      input.bugbotStatus == null)
  ) {
    return "ready"
  }

  return "in_progress"
}
