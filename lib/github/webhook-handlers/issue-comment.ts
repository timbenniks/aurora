import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { taskIndex } from "@/db/schema"
import {
  findWorkspaceByGithubRepoId,
  refreshWorkspaceTaskCounts,
  updateWorkspaceActivity,
  upsertTaskFromGitHubIssue,
} from "@/lib/github/workspace-index"

type GitHubIssue = {
  id: number
  number: number
  title: string
  state: "open" | "closed"
  labels: Array<{ name: string }>
}

type IssueCommentPayload = {
  action: string
  issue: GitHubIssue
  comment: { body: string }
  repository: { id: number }
}

export async function handleIssueCommentWebhook(payload: IssueCommentPayload) {
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
  const mentionsAgent = /\/agent\b/i.test(payload.comment.body)

  if (tracked || hasAuroraLabel || mentionsAgent) {
    await upsertTaskFromGitHubIssue({
      workspaceId: workspace.id,
      githubIssueId: payload.issue.id,
      issueNumber: payload.issue.number,
      title: payload.issue.title,
      state: payload.issue.state,
      labels,
    })

    await refreshWorkspaceTaskCounts(workspace.id)
  }

  await updateWorkspaceActivity(workspace.id)

  return { handled: true, workspaceId: workspace.id }
}
