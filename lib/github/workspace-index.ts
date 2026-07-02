import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  prIndex,
  taskIndex,
  workspaceStatus,
  workspaces,
  type workspaces as workspacesTable,
} from "@/db/schema"
import { calculateReadiness } from "@/lib/aurora/readiness"
import { githubApiRequest } from "@/lib/github/client"

export type WorkspaceRecord = typeof workspacesTable.$inferSelect & {
  installation: {
    githubInstallationId: number
  }
}

export async function findWorkspaceByGithubRepoId(
  githubRepoId: number
): Promise<WorkspaceRecord | null> {
  const row = await db.query.workspaces.findFirst({
    where: eq(workspaces.githubRepoId, githubRepoId),
    with: { installation: true },
  })

  if (!row?.installation) {
    return null
  }

  return row as WorkspaceRecord
}

export async function findWorkspaceByOwnerRepo(
  owner: string,
  repo: string
): Promise<WorkspaceRecord | null> {
  const row = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.owner, owner), eq(workspaces.repo, repo)),
    with: { installation: true },
  })

  if (!row?.installation) {
    return null
  }

  return row as WorkspaceRecord
}

export async function updateWorkspaceActivity(workspaceId: string) {
  const now = new Date()

  await db
    .update(workspaces)
    .set({ lastActivityAt: now, updatedAt: now })
    .where(eq(workspaces.id, workspaceId))
}

export async function refreshWorkspaceTaskCounts(workspaceId: string) {
  const openTasks = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskIndex)
    .where(
      and(eq(taskIndex.workspaceId, workspaceId), eq(taskIndex.state, "open"))
    )

  const openCount = openTasks[0]?.count ?? 0

  await db
    .update(workspaceStatus)
    .set({
      openAgentTasks: openCount,
      activeAgentTasks: openCount,
      updatedAt: new Date(),
    })
    .where(eq(workspaceStatus.workspaceId, workspaceId))
}

export async function refreshWorkspacePrCounts(workspaceId: string) {
  const rows = await db.query.prIndex.findMany({
    where: eq(prIndex.workspaceId, workspaceId),
    columns: { state: true, ciStatus: true },
  })

  const openAgentPrs = rows.filter((row) => row.state === "open").length
  const blockedPrs = rows.filter(
    (row) =>
      row.state === "open" &&
      (row.ciStatus === "failure" || row.ciStatus === "cancelled")
  ).length
  const mergedAgentPrs = rows.filter((row) => row.state === "merged").length

  await db
    .update(workspaceStatus)
    .set({
      openAgentPrs,
      blockedPrs,
      mergedAgentPrs,
      updatedAt: new Date(),
    })
    .where(eq(workspaceStatus.workspaceId, workspaceId))
}

export async function upsertTaskFromGitHubIssue(input: {
  workspaceId: string
  githubIssueId: number
  issueNumber: number
  title: string
  state: "open" | "closed"
  labels: string[]
}) {
  const now = new Date()

  await db
    .insert(taskIndex)
    .values({
      workspaceId: input.workspaceId,
      githubIssueId: input.githubIssueId,
      issueNumber: input.issueNumber,
      title: input.title,
      state: input.state,
      status: input.state,
      labelsJson: input.labels,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [taskIndex.workspaceId, taskIndex.issueNumber],
      set: {
        githubIssueId: input.githubIssueId,
        title: input.title,
        state: input.state,
        status: input.state,
        labelsJson: input.labels,
        updatedAt: now,
      },
    })
}

export async function removeTaskFromIndex(
  workspaceId: string,
  issueNumber: number
) {
  await db
    .delete(taskIndex)
    .where(
      and(
        eq(taskIndex.workspaceId, workspaceId),
        eq(taskIndex.issueNumber, issueNumber)
      )
    )
}

export async function upsertPullRequestIndex(input: {
  workspaceId: string
  githubPrId: number
  prNumber: number
  title: string
  state: "open" | "closed" | "merged"
  branch?: string
  author?: string
  sourceIssueNumber?: number | null
  ciStatus?: string | null
  bugbotStatus?: string | null
  approvalStatus?: string | null
  humanReviewRequired?: boolean | null
  mergedAt?: Date | null
}) {
  const now = new Date()

  await db
    .insert(prIndex)
    .values({
      workspaceId: input.workspaceId,
      githubPrId: input.githubPrId,
      prNumber: input.prNumber,
      title: input.title,
      state: input.state,
      branch: input.branch ?? null,
      author: input.author ?? null,
      sourceIssueNumber: input.sourceIssueNumber ?? null,
      agentProvider: "cursor",
      ciStatus: input.ciStatus ?? null,
      bugbotStatus: input.bugbotStatus ?? null,
      approvalStatus: input.approvalStatus ?? null,
      humanReviewRequired: input.humanReviewRequired ?? null,
      mergedAt: input.mergedAt ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [prIndex.workspaceId, prIndex.prNumber],
      set: {
        githubPrId: input.githubPrId,
        title: input.title,
        state: input.state,
        branch: input.branch ?? null,
        author: input.author ?? null,
        sourceIssueNumber: input.sourceIssueNumber ?? null,
        ciStatus: input.ciStatus ?? null,
        bugbotStatus: input.bugbotStatus ?? null,
        approvalStatus: input.approvalStatus ?? null,
        humanReviewRequired: input.humanReviewRequired ?? null,
        mergedAt: input.mergedAt ?? null,
        updatedAt: now,
      },
    })

  if (input.sourceIssueNumber) {
    await db
      .update(taskIndex)
      .set({ linkedPrNumber: input.prNumber, updatedAt: now })
      .where(
        and(
          eq(taskIndex.workspaceId, input.workspaceId),
          eq(taskIndex.issueNumber, input.sourceIssueNumber)
        )
      )
  }
}

export async function updatePullRequestCiStatus(input: {
  workspaceId: string
  headSha: string
  ciStatus: string
  token: string
  owner: string
  repo: string
}) {
  type PullRequestListItem = {
    number: number
    head: { sha: string }
  }

  const pulls = await githubApiRequest<PullRequestListItem[]>(
    `/repos/${input.owner}/${input.repo}/pulls?state=open&per_page=30`,
    input.token
  )

  const match = pulls.find((pull) => pull.head.sha === input.headSha)

  if (!match) {
    return
  }

  await db
    .update(prIndex)
    .set({ ciStatus: input.ciStatus, updatedAt: new Date() })
    .where(
      and(
        eq(prIndex.workspaceId, input.workspaceId),
        eq(prIndex.prNumber, match.number)
      )
    )
}

export async function applyReadinessToWorkspace(
  workspaceId: string,
  existingPaths: string[]
) {
  const readiness = calculateReadiness(existingPaths)

  await db
    .update(workspaceStatus)
    .set({
      readinessScore: readiness.score,
      hasAgentsMd: readiness.hasAgentsMd,
      hasBugbotMd: readiness.hasBugbotMd,
      hasApprovalPolicy: readiness.hasApprovalPolicy,
      hasCursorRules: readiness.hasCursorRules,
      hasRoutingPolicy: readiness.hasRoutingPolicy,
      hasIssueTemplate: readiness.hasIssueTemplate,
      hasPrTemplate: readiness.hasPrTemplate,
      hasValidationWorkflow: readiness.hasValidationWorkflow,
      updatedAt: new Date(),
    })
    .where(eq(workspaceStatus.workspaceId, workspaceId))
}
