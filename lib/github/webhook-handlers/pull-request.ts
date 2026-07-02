import {
  inferPullRequestMetadata,
  isAgentPullRequest,
} from "@/lib/github/pr-inference"
import {
  findWorkspaceByGithubRepoId,
  refreshWorkspacePrCounts,
  updateWorkspaceActivity,
  upsertPullRequestIndex,
} from "@/lib/github/workspace-index"

type GitHubPullRequest = {
  id: number
  number: number
  title: string
  state: "open" | "closed"
  merged: boolean
  merged_at: string | null
  draft?: boolean
  body?: string | null
  head: { ref: string; sha: string }
  user: { login: string } | null
  labels?: Array<{ name: string }>
}

type GitHubRepository = {
  id: number
}

type PullRequestPayload = {
  action: string
  pull_request: GitHubPullRequest
  repository: GitHubRepository
}

function resolvePrState(pullRequest: GitHubPullRequest): "open" | "closed" | "merged" {
  if (pullRequest.merged) {
    return "merged"
  }

  return pullRequest.state
}

export async function handlePullRequestWebhook(payload: PullRequestPayload) {
  const workspace = await findWorkspaceByGithubRepoId(payload.repository.id)

  if (!workspace) {
    return { handled: false, reason: "workspace_not_found" }
  }

  const pullRequest = payload.pull_request
  const labels = pullRequest.labels?.map((label) => label.name) ?? []

  if (!isAgentPullRequest(pullRequest.head.ref, labels)) {
    return { handled: true, workspaceId: workspace.id, skipped: "non_agent_pr" }
  }

  const inferred = inferPullRequestMetadata({
    branch: pullRequest.head.ref,
    body: pullRequest.body,
    labels,
    draft: pullRequest.draft,
  })

  const state = resolvePrState(pullRequest)

  await upsertPullRequestIndex({
    workspaceId: workspace.id,
    githubPrId: pullRequest.id,
    prNumber: pullRequest.number,
    title: pullRequest.title,
    state,
    branch: pullRequest.head.ref,
    author: pullRequest.user?.login,
    sourceIssueNumber: inferred.sourceIssueNumber,
    bugbotStatus: inferred.bugbotStatus,
    approvalStatus: inferred.approvalStatus,
    humanReviewRequired: inferred.humanReviewRequired,
    mergedAt: pullRequest.merged_at ? new Date(pullRequest.merged_at) : null,
  })

  await refreshWorkspacePrCounts(workspace.id)
  await updateWorkspaceActivity(workspace.id)

  return { handled: true, workspaceId: workspace.id }
}
