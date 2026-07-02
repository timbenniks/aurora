import { eq } from "drizzle-orm"

import { db } from "@/db"
import { taskIndex, workspaces } from "@/db/schema"
import { GitHubApiError, githubApiRequest } from "@/lib/github/client"
import { scanRepositorySetupFiles } from "@/lib/github/scan-repository"
import {
  applyReadinessToWorkspace,
  refreshWorkspacePrCounts,
  refreshWorkspaceTaskCounts,
  upsertPullRequestIndex,
  upsertTaskFromGitHubIssue,
} from "@/lib/github/workspace-index"
import {
  resolveRepoAccessTokens,
  resolveRepoOwner,
} from "@/lib/github/token"
import { withRepoToken } from "@/lib/github/with-repo-token"
import {
  inferPullRequestMetadata,
  isAgentPullRequest,
} from "@/lib/github/pr-inference"
import { ensureRepositoryWebhookSafe } from "@/lib/github/webhooks-register"

type GitHubIssue = {
  id: number
  number: number
  title: string
  state: "open" | "closed"
  labels: Array<{ name: string }>
}

type GitHubPullRequest = {
  id: number
  number: number
  title: string
  state: "open" | "closed"
  merged_at: string | null
  draft?: boolean
  body?: string | null
  head: { ref: string }
  user: { login: string } | null
  labels?: Array<{ name: string }>
}

export async function syncWorkspaceFromGitHub(input: {
  workspaceId: string
  githubLogin: string
  userAccessToken?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, input.workspaceId),
    with: { installation: true },
  })

  if (!workspace?.installation) {
    return { ok: false, error: "Workspace not found." }
  }

  const access = await resolveRepoAccessTokens(
    workspace.installation.githubInstallationId,
    input.githubLogin,
    input.userAccessToken
  )
  const owner = resolveRepoOwner(access.account, input.githubLogin, workspace.owner)

  await ensureRepositoryWebhookSafe({
    owner,
    repo: workspace.repo,
    installationId: workspace.installation.githubInstallationId,
  })

  await withRepoToken(
    { primary: access.primary, fallback: access.fallback },
    async (token) => {
      const scan = await scanRepositorySetupFiles({
        owner,
        repo: workspace.repo,
        defaultBranch: workspace.defaultBranch,
        token,
      })

      await applyReadinessToWorkspace(workspace.id, scan.existingPaths)

      const indexedTasks = await db.query.taskIndex.findMany({
        where: eq(taskIndex.workspaceId, workspace.id),
        columns: { issueNumber: true },
      })

      for (const task of indexedTasks) {
        try {
          const issue = await githubApiRequest<GitHubIssue>(
            `/repos/${owner}/${workspace.repo}/issues/${task.issueNumber}`,
            token
          )

          await upsertTaskFromGitHubIssue({
            workspaceId: workspace.id,
            githubIssueId: issue.id,
            issueNumber: issue.number,
            title: issue.title,
            state: issue.state,
            labels: issue.labels.map((label) => label.name),
          })
        } catch (error) {
          if (error instanceof GitHubApiError && error.status === 404) {
            continue
          }

          throw error
        }
      }

      const pulls = await githubApiRequest<GitHubPullRequest[]>(
        `/repos/${owner}/${workspace.repo}/pulls?state=all&per_page=50&sort=updated&direction=desc`,
        token
      )

      for (const pull of pulls) {
        const labels = pull.labels?.map((label) => label.name) ?? []

        if (!isAgentPullRequest(pull.head.ref, labels)) {
          continue
        }

        const state = pull.merged_at
          ? ("merged" as const)
          : pull.state === "open"
            ? ("open" as const)
            : ("closed" as const)

        const metadata = inferPullRequestMetadata({
          branch: pull.head.ref,
          body: pull.body,
          labels,
          draft: pull.draft,
        })

        await upsertPullRequestIndex({
          workspaceId: workspace.id,
          githubPrId: pull.id,
          prNumber: pull.number,
          title: pull.title,
          state,
          branch: pull.head.ref,
          author: pull.user?.login,
          sourceIssueNumber: metadata.sourceIssueNumber,
          bugbotStatus: metadata.bugbotStatus,
          approvalStatus: metadata.approvalStatus,
          humanReviewRequired: metadata.humanReviewRequired,
          mergedAt: pull.merged_at ? new Date(pull.merged_at) : null,
        })
      }
    }
  )

  await refreshWorkspaceTaskCounts(workspace.id)
  await refreshWorkspacePrCounts(workspace.id)

  const now = new Date()

  await db
    .update(workspaces)
    .set({
      lastSyncedAt: now,
      lastActivityAt: now,
      lastScannedAt: now,
      updatedAt: now,
    })
    .where(eq(workspaces.id, workspace.id))

  return { ok: true }
}
