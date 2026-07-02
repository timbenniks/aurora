import { desc, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import { prIndex, users, workspaces } from "@/db/schema"
import {
  classifyPullRequest,
  type InboxBucket,
} from "@/lib/aurora/pr-classifier"

export type InboxPullRequest = {
  id: string
  workspaceId: string
  repoFullName: string
  prNumber: number
  title: string
  state: string
  branch: string | null
  sourceIssueNumber: number | null
  ciStatus: string | null
  bugbotStatus: string | null
  approvalStatus: string | null
  humanReviewRequired: boolean | null
  bucket: InboxBucket
  prUrl: string
  issueUrl: string | null
  updatedAt: string
}

export type InboxSummary = {
  readyCount: number
  needsReviewCount: number
  inProgressCount: number
}

export type InboxData = {
  ready: InboxPullRequest[]
  needsReview: InboxPullRequest[]
  inProgress: InboxPullRequest[]
  summary: InboxSummary
}

function toInboxItem(
  pull: typeof prIndex.$inferSelect,
  workspace: { fullName: string }
): InboxPullRequest | null {
  const bucket = classifyPullRequest({
    state: pull.state,
    ciStatus: pull.ciStatus,
    bugbotStatus: pull.bugbotStatus,
    approvalStatus: pull.approvalStatus,
    humanReviewRequired: pull.humanReviewRequired,
  })

  if (!bucket) {
    return null
  }

  return {
    id: pull.id,
    workspaceId: pull.workspaceId,
    repoFullName: workspace.fullName,
    prNumber: pull.prNumber,
    title: pull.title,
    state: pull.state,
    branch: pull.branch,
    sourceIssueNumber: pull.sourceIssueNumber,
    ciStatus: pull.ciStatus,
    bugbotStatus: pull.bugbotStatus,
    approvalStatus: pull.approvalStatus,
    humanReviewRequired: pull.humanReviewRequired,
    bucket,
    prUrl: `https://github.com/${workspace.fullName}/pull/${pull.prNumber}`,
    issueUrl: pull.sourceIssueNumber
      ? `https://github.com/${workspace.fullName}/issues/${pull.sourceIssueNumber}`
      : null,
    updatedAt: pull.updatedAt.toISOString(),
  }
}

export async function getInboxForUser(
  githubUserId: number
): Promise<InboxData> {
  const user = await db.query.users.findFirst({
    where: eq(users.githubUserId, githubUserId),
  })

  if (!user) {
    return {
      ready: [],
      needsReview: [],
      inProgress: [],
      summary: { readyCount: 0, needsReviewCount: 0, inProgressCount: 0 },
    }
  }

  const userWorkspaces = await db.query.workspaces.findMany({
    where: eq(workspaces.userId, user.id),
    columns: { id: true, fullName: true },
  })

  if (userWorkspaces.length === 0) {
    return {
      ready: [],
      needsReview: [],
      inProgress: [],
      summary: { readyCount: 0, needsReviewCount: 0, inProgressCount: 0 },
    }
  }

  const workspaceIds = userWorkspaces.map((workspace) => workspace.id)
  const workspaceById = new Map(
    userWorkspaces.map((workspace) => [workspace.id, workspace])
  )

  const pulls = await db.query.prIndex.findMany({
    where: inArray(prIndex.workspaceId, workspaceIds),
    orderBy: [desc(prIndex.updatedAt)],
  })

  const ready: InboxPullRequest[] = []
  const needsReview: InboxPullRequest[] = []
  const inProgress: InboxPullRequest[] = []

  for (const pull of pulls) {
    const workspace = workspaceById.get(pull.workspaceId)

    if (!workspace) {
      continue
    }

    const item = toInboxItem(pull, workspace)

    if (!item) {
      continue
    }

    if (item.bucket === "ready") {
      ready.push(item)
    } else if (item.bucket === "needs_review") {
      needsReview.push(item)
    } else {
      inProgress.push(item)
    }
  }

  return {
    ready,
    needsReview,
    inProgress,
    summary: {
      readyCount: ready.length,
      needsReviewCount: needsReview.length,
      inProgressCount: inProgress.length,
    },
  }
}

export async function getInboxSummaryForUser(
  githubUserId: number
): Promise<InboxSummary> {
  const inbox = await getInboxForUser(githubUserId)

  return inbox.summary
}
