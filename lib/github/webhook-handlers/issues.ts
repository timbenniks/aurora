import {
  findWorkspaceByGithubRepoId,
  refreshWorkspaceTaskCounts,
  removeTaskFromIndex,
  updateWorkspaceActivity,
  upsertTaskFromGitHubIssue,
} from "@/lib/github/workspace-index"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { taskIndex } from "@/db/schema"

type GitHubLabel = { name: string }

type GitHubRepository = {
  id: number
  name: string
  owner: { login: string }
  default_branch?: string
}

type GitHubIssue = {
  id: number
  number: number
  title: string
  state: "open" | "closed"
  labels: GitHubLabel[]
}

type IssuesPayload = {
  action: string
  issue: GitHubIssue
  repository: GitHubRepository
}

export async function handleIssuesWebhook(payload: IssuesPayload) {
  const workspace = await findWorkspaceByGithubRepoId(payload.repository.id)

  if (!workspace) {
    return { handled: false, reason: "workspace_not_found" }
  }

  const labels = payload.issue.labels.map((label) => label.name)

  const tracked = await db.query.taskIndex.findFirst({
    where: and(
      eq(taskIndex.workspaceId, workspace.id),
      eq(taskIndex.issueNumber, payload.issue.number)
    ),
    columns: { id: true },
  })

  const hasAuroraLabel = labels.some((label) => label.startsWith("aurora:"))

  if (!tracked && !hasAuroraLabel) {
    return { handled: true, workspaceId: workspace.id, skipped: "untracked_issue" }
  }

  if (payload.action === "deleted") {
    await removeTaskFromIndex(workspace.id, payload.issue.number)
  } else {
    await upsertTaskFromGitHubIssue({
      workspaceId: workspace.id,
      githubIssueId: payload.issue.id,
      issueNumber: payload.issue.number,
      title: payload.issue.title,
      state: payload.issue.state,
      labels,
    })
  }

  await refreshWorkspaceTaskCounts(workspace.id)
  await updateWorkspaceActivity(workspace.id)

  return { handled: true, workspaceId: workspace.id }
}
