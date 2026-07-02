import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import {
  githubInstallations,
  taskIndex,
  users,
  workspaceStatus,
  workspaces,
} from "@/db/schema"
import { calculateReadiness } from "@/lib/aurora/readiness"
import type { LaunchBrief } from "@/lib/aurora/types"
import { ensureRepositoryWebhookSafe } from "@/lib/github/webhooks-register"
import { GitHubApiError } from "@/lib/github/client"
import type { CreatedIssue } from "@/lib/github/issues"
import { deleteRepository } from "@/lib/github/repos"
import type { InstallationAccount } from "@/lib/github/installation"
import type { RepositoryRef } from "@/lib/github/repos"
import type { BootstrapResult } from "@/lib/workspaces/bootstrap-repository"

export type SessionUserInput = {
  githubUserId: number
  githubLogin: string
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
}

export type PersistWorkspaceInput = {
  user: SessionUserInput
  installationId: number
  installationAccount: InstallationAccount
  brief: LaunchBrief
  repo: RepositoryRef
  bootstrap: BootstrapResult
  createdFrom?: "launch_brief" | "existing_repo" | "imported"
}

export type WorkspaceListItem = {
  id: string
  owner: string
  repo: string
  fullName: string
  url: string
  projectType: string
  workflowPreset: string
  readinessScore: number
  openAgentTasks: number
  activeAgentTasks: number
  openAgentPrs: number
  blockedPrs: number
  lastActivityAt: string
  createdAt: string
}

export type WorkspaceDetail = WorkspaceListItem & {
  defaultBranch: string
  visibility: string
  createdFrom: string
  status: {
    readinessScore: number
    hasAgentsMd: boolean
    hasBugbotMd: boolean
    hasApprovalPolicy: boolean
    hasCursorRules: boolean
    hasRoutingPolicy: boolean
    hasIssueTemplate: boolean
    hasPrTemplate: boolean
    hasValidationWorkflow: boolean
    openAgentPrs: number
    blockedPrs: number
    mergedAgentPrs: number
    lastError: string | null
  }
  tasks: Array<{
    id: string
    issueNumber: number
    title: string
    state: string
    status: string
    risk: string | null
    priority: string | null
    milestone: string | null
    labels: string[]
    linkedPrNumber: number | null
    agentCommand: string | null
    agentPrompt: string | null
    taskId: string | null
    cursorAgentId: string | null
    cursorRunId: string | null
    cursorRunStatus: string | null
    cursorAgentUrl: string | null
    cursorLaunchedAt: string | null
    createdAt: string
    url: string
  }>
  pullRequests: Array<{
    id: string
    prNumber: number
    title: string
    state: string
    branch: string | null
    sourceIssueNumber: number | null
    ciStatus: string | null
    bugbotStatus: string | null
    approvalStatus: string | null
    humanReviewRequired: boolean | null
    updatedAt: string
    createdAt: string
    mergedAt: string | null
    url: string
    issueUrl: string | null
  }>
}

async function getUserByGithubId(githubUserId: number) {
  return db.query.users.findFirst({
    where: eq(users.githubUserId, githubUserId),
  })
}

async function upsertUser(user: SessionUserInput) {
  const set = {
    githubLogin: user.githubLogin,
    name: user.name ?? null,
    email: user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
    updatedAt: new Date(),
  }

  const [row] = await db
    .insert(users)
    .values({ githubUserId: user.githubUserId, ...set })
    .onConflictDoUpdate({ target: users.githubUserId, set })
    .returning()

  return row
}

async function upsertInstallation(
  installationId: number,
  account: InstallationAccount
) {
  const set = {
    accountLogin: account.login,
    accountType: account.type,
    updatedAt: new Date(),
  }

  const [row] = await db
    .insert(githubInstallations)
    .values({ githubInstallationId: installationId, ...set })
    .onConflictDoUpdate({
      target: githubInstallations.githubInstallationId,
      set,
    })
    .returning()

  return row
}

function buildTaskRows(
  workspaceId: string,
  brief: LaunchBrief,
  issues: CreatedIssue[]
) {
  const taskById = new Map(brief.tasks.map((task) => [task.id, task]))
  const now = new Date()

  return issues.map((issue) => {
    const task = taskById.get(issue.taskId)

    return {
      workspaceId,
      issueNumber: issue.number,
      title: issue.title,
      state: "open" as const,
      status: "open",
      risk: task?.risk ?? null,
      priority: task?.priority ?? null,
      milestone: task?.milestone ?? null,
      labelsJson: task?.labels ?? [],
      linkedPrNumber: null,
      agentCommand: task?.agent_kickoff.command ?? null,
      agentPrompt: task?.agent_kickoff.prompt ?? null,
      taskId: issue.taskId,
      updatedAt: now,
      createdAt: now,
    }
  })
}

export async function persistWorkspaceFromBootstrap(
  input: PersistWorkspaceInput
): Promise<{ workspaceId: string }> {
  const user = await upsertUser(input.user)
  const installation = await upsertInstallation(
    input.installationId,
    input.installationAccount
  )

  const readiness = calculateReadiness(input.bootstrap.filePaths)
  const openTaskCount = input.bootstrap.issues.length
  const now = new Date()

  const workspaceSet = {
    userId: user.id,
    githubInstallationId: installation.id,
    owner: input.repo.owner,
    repo: input.repo.name,
    fullName: input.repo.fullName,
    defaultBranch: input.repo.defaultBranch,
    visibility: input.brief.project.visibility,
    projectType: input.brief.project.project_type,
    workflowPreset: input.brief.workflow.preset,
    lastSyncedAt: now,
    lastActivityAt: now,
    updatedAt: now,
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({
      ...workspaceSet,
      githubRepoId: input.repo.id,
      createdFrom: input.createdFrom ?? "launch_brief",
      enabledAt: now,
    })
    .onConflictDoUpdate({
      target: workspaces.githubRepoId,
      set: workspaceSet,
    })
    .returning()

  const statusSet = {
    readinessScore: readiness.score,
    hasAgentsMd: readiness.hasAgentsMd,
    hasBugbotMd: readiness.hasBugbotMd,
    hasApprovalPolicy: readiness.hasApprovalPolicy,
    hasCursorRules: readiness.hasCursorRules,
    hasRoutingPolicy: readiness.hasRoutingPolicy,
    hasIssueTemplate: readiness.hasIssueTemplate,
    hasPrTemplate: readiness.hasPrTemplate,
    hasValidationWorkflow: readiness.hasValidationWorkflow,
    openAgentTasks: openTaskCount,
    activeAgentTasks: openTaskCount,
    updatedAt: now,
  }

  await db
    .insert(workspaceStatus)
    .values({
      ...statusSet,
      workspaceId: workspace.id,
      openAgentPrs: 0,
      blockedPrs: 0,
      mergedAgentPrs: 0,
      lastError: null,
    })
    .onConflictDoUpdate({
      target: workspaceStatus.workspaceId,
      set: statusSet,
    })

  await db.delete(taskIndex).where(eq(taskIndex.workspaceId, workspace.id))

  const taskRows = buildTaskRows(
    workspace.id,
    input.brief,
    input.bootstrap.issues
  )

  if (taskRows.length > 0) {
    await db.insert(taskIndex).values(taskRows)
  }

  void ensureRepositoryWebhookSafe({
    owner: input.repo.owner,
    repo: input.repo.name,
    installationId: input.installationId,
  })

  return { workspaceId: workspace.id }
}

function toListItem(
  row: typeof workspaces.$inferSelect & {
    status: typeof workspaceStatus.$inferSelect | null
  },
  url: string
): WorkspaceListItem {
  return {
    id: row.id,
    owner: row.owner,
    repo: row.repo,
    fullName: row.fullName,
    url,
    projectType: row.projectType,
    workflowPreset: row.workflowPreset,
    readinessScore: row.status?.readinessScore ?? 0,
    openAgentTasks: row.status?.openAgentTasks ?? 0,
    activeAgentTasks: row.status?.activeAgentTasks ?? 0,
    openAgentPrs: row.status?.openAgentPrs ?? 0,
    blockedPrs: row.status?.blockedPrs ?? 0,
    lastActivityAt: row.lastActivityAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

export async function findWorkspaceByGithubRepoId(
  githubRepoId: number,
  githubUserId: number
): Promise<{ id: string } | null> {
  const user = await getUserByGithubId(githubUserId)

  if (!user) {
    return null
  }

  const row = await db.query.workspaces.findFirst({
    where: and(
      eq(workspaces.githubRepoId, githubRepoId),
      eq(workspaces.userId, user.id)
    ),
    columns: { id: true },
  })

  return row ?? null
}

export async function listLinkedGithubRepoIds(
  githubUserId: number
): Promise<Set<number>> {
  const user = await getUserByGithubId(githubUserId)

  if (!user) {
    return new Set()
  }

  const rows = await db.query.workspaces.findMany({
    where: eq(workspaces.userId, user.id),
    columns: { githubRepoId: true },
  })

  return new Set(rows.map((row) => row.githubRepoId))
}

export async function listWorkspacesForUser(
  githubUserId: number
): Promise<WorkspaceListItem[]> {
  const user = await getUserByGithubId(githubUserId)

  if (!user) {
    return []
  }

  const rows = await db.query.workspaces.findMany({
    where: eq(workspaces.userId, user.id),
    with: { status: true },
    orderBy: [desc(workspaces.lastActivityAt)],
  })

  return rows.map((row) =>
    toListItem(row, `https://github.com/${row.fullName}`)
  )
}

export async function getWorkspaceForUser(
  workspaceId: string,
  githubUserId: number
): Promise<WorkspaceDetail | null> {
  const user = await getUserByGithubId(githubUserId)

  if (!user) {
    return null
  }

  const row = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.id, workspaceId), eq(workspaces.userId, user.id)),
    with: {
      status: true,
      tasks: {
        orderBy: (tasks, { asc }) => [asc(tasks.issueNumber)],
      },
      pullRequests: {
        orderBy: (pulls, { desc }) => [desc(pulls.updatedAt)],
      },
    },
  })

  if (!row || !row.status) {
    return null
  }

  const base = toListItem(row, `https://github.com/${row.fullName}`)

  return {
    ...base,
    defaultBranch: row.defaultBranch,
    visibility: row.visibility,
    createdFrom: row.createdFrom,
    status: {
      readinessScore: row.status.readinessScore,
      hasAgentsMd: row.status.hasAgentsMd,
      hasBugbotMd: row.status.hasBugbotMd,
      hasApprovalPolicy: row.status.hasApprovalPolicy,
      hasCursorRules: row.status.hasCursorRules,
      hasRoutingPolicy: row.status.hasRoutingPolicy,
      hasIssueTemplate: row.status.hasIssueTemplate,
      hasPrTemplate: row.status.hasPrTemplate,
      hasValidationWorkflow: row.status.hasValidationWorkflow,
      openAgentPrs: row.status.openAgentPrs,
      blockedPrs: row.status.blockedPrs,
      mergedAgentPrs: row.status.mergedAgentPrs,
      lastError: row.status.lastError,
    },
    tasks: row.tasks.map((task) => ({
      id: task.id,
      issueNumber: task.issueNumber,
      title: task.title,
      state: task.state,
      status: task.status,
      risk: task.risk,
      priority: task.priority,
      milestone: task.milestone,
      labels: task.labelsJson ?? [],
      linkedPrNumber: task.linkedPrNumber,
      agentCommand: task.agentCommand,
      agentPrompt: task.agentPrompt,
      taskId: task.taskId,
      cursorAgentId: task.cursorAgentId,
      cursorRunId: task.cursorRunId,
      cursorRunStatus: task.cursorRunStatus,
      cursorAgentUrl: task.cursorAgentUrl,
      cursorLaunchedAt: task.cursorLaunchedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      url: `https://github.com/${row.fullName}/issues/${task.issueNumber}`,
    })),
    pullRequests: row.pullRequests.map((pull) => ({
      id: pull.id,
      prNumber: pull.prNumber,
      title: pull.title,
      state: pull.state,
      branch: pull.branch,
      sourceIssueNumber: pull.sourceIssueNumber,
      ciStatus: pull.ciStatus,
      bugbotStatus: pull.bugbotStatus,
      approvalStatus: pull.approvalStatus,
      humanReviewRequired: pull.humanReviewRequired,
      updatedAt: pull.updatedAt.toISOString(),
      createdAt: pull.createdAt.toISOString(),
      mergedAt: pull.mergedAt?.toISOString() ?? null,
      url: `https://github.com/${row.fullName}/pull/${pull.prNumber}`,
      issueUrl: pull.sourceIssueNumber
        ? `https://github.com/${row.fullName}/issues/${pull.sourceIssueNumber}`
        : null,
    })),
  }
}

export function confirmNameMatches(
  confirmName: string,
  owner: string,
  repo: string,
  fullName: string
): boolean {
  const normalized = confirmName.trim().toLowerCase()

  return (
    normalized === repo.toLowerCase() ||
    normalized === fullName.toLowerCase() ||
    normalized === `${owner}/${repo}`.toLowerCase()
  )
}

export async function deleteWorkspaceForUser(input: {
  workspaceId: string
  githubUserId: number
  githubLogin: string
  confirmName: string
  userAccessToken?: string
}): Promise<
  | { ok: true }
  | { ok: false; status: number; code: string; error: string }
> {
  const user = await getUserByGithubId(input.githubUserId)

  if (!user) {
    return {
      ok: false,
      status: 404,
      code: "not_found",
      error: "Workspace not found.",
    }
  }

  const row = await db.query.workspaces.findFirst({
    where: and(
      eq(workspaces.id, input.workspaceId),
      eq(workspaces.userId, user.id)
    ),
    with: { installation: true },
  })

  if (!row || !row.installation) {
    return {
      ok: false,
      status: 404,
      code: "not_found",
      error: "Workspace not found.",
    }
  }

  if (
    !confirmNameMatches(
      input.confirmName,
      row.owner,
      row.repo,
      row.fullName
    )
  ) {
    return {
      ok: false,
      status: 422,
      code: "confirm_name_mismatch",
      error: `Type ${row.repo} or ${row.fullName} to confirm deletion.`,
    }
  }

  try {
    await deleteRepository({
      installationId: row.installation.githubInstallationId,
      owner: row.owner,
      name: row.repo,
      githubLogin: input.githubLogin,
      userAccessToken: input.userAccessToken,
    })
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      // Repo already removed on GitHub — still clear Aurora index rows.
    } else if (error instanceof GitHubApiError && error.status === 403) {
      return {
        ok: false,
        status: 403,
        code: "github_forbidden",
        error:
          "GitHub denied repository deletion. Check that the Aurora App has admin access.",
      }
    } else {
      throw error
    }
  }

  await db.delete(workspaces).where(eq(workspaces.id, row.id))

  return { ok: true }
}
