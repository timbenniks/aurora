import type { LaunchBrief } from "@/lib/aurora/types"
import {
  generateAllFiles,
  generateIssueBodies,
  getDefaultLabels,
} from "@/lib/aurora/generate-files"
import { commitFiles } from "@/lib/github/commits"
import { formatGitHubError } from "@/lib/github/errors"
import { GitHubApiError } from "@/lib/github/client"
import { mapGitHubError } from "@/lib/github/errors"
import { createIssues, type CreatedIssue } from "@/lib/github/issues"
import { createLabels } from "@/lib/github/labels"
import {
  createMilestones,
  type MilestoneMap,
} from "@/lib/github/milestones"
import {
  ensureRepositoryIssuesEnabled,
  type RepositoryRef,
} from "@/lib/github/repos"
import {
  resolveRepoAccessTokens,
  resolveRepoOwner,
} from "@/lib/github/token"
import { withRepoToken } from "@/lib/github/with-repo-token"

export type BootstrapResult = {
  filesCommitted: number
  filePaths: string[]
  labelsCreated: number
  labelsSkipped: number
  milestonesCreated: number
  issues: CreatedIssue[]
  warnings: string[]
}

export type BootstrapContext = {
  brief: LaunchBrief
  repo: RepositoryRef
  installationId: number
  githubLogin: string
  userAccessToken?: string
  owner: string
  tokens: { primary: string; fallback?: string }
}

async function createBootstrapContext(
  brief: LaunchBrief,
  repo: RepositoryRef,
  installationId: number,
  githubLogin: string,
  userAccessToken?: string
): Promise<BootstrapContext> {
  const access = await resolveRepoAccessTokens(
    installationId,
    githubLogin,
    userAccessToken
  )

  return {
    brief,
    repo,
    installationId,
    githubLogin,
    userAccessToken,
    owner: resolveRepoOwner(access.account, githubLogin, repo.owner),
    tokens: { primary: access.primary, fallback: access.fallback },
  }
}

function collectIssueLabels(brief: LaunchBrief): string[] {
  const labels = new Set(getDefaultLabels())

  for (const issue of generateIssueBodies(brief)) {
    for (const label of issue.labels) {
      labels.add(label)
    }
  }

  return [...labels]
}

function formatStepError(error: unknown): string {
  if (error instanceof GitHubApiError) {
    return formatGitHubError(error)
  }

  return mapGitHubError(error).message
}

export async function bootstrapCommitFiles(
  ctx: BootstrapContext,
  options?: { skip?: boolean }
): Promise<Pick<BootstrapResult, "filesCommitted" | "filePaths" | "warnings">> {
  const files = generateAllFiles(ctx.brief)
  const filePaths = files.map((file) => file.path)
  const warnings: string[] = []

  if (options?.skip) {
    return { filesCommitted: files.length, filePaths, warnings }
  }

  try {
    const commit = await commitFiles(
      ctx.owner,
      ctx.repo.name,
      ctx.repo.defaultBranch,
      files,
      "chore: bootstrap Aurora workspace",
      ctx.tokens
    )

    return {
      filesCommitted: commit.fileCount,
      filePaths,
      warnings,
    }
  } catch (error) {
    warnings.push(`Could not commit files: ${formatStepError(error)}`)
    return { filesCommitted: 0, filePaths, warnings }
  }
}

export async function bootstrapLabels(
  ctx: BootstrapContext
): Promise<
  Pick<BootstrapResult, "labelsCreated" | "labelsSkipped" | "warnings">
> {
  const warnings: string[] = []

  try {
    await withRepoToken(ctx.tokens, (token) =>
      ensureRepositoryIssuesEnabled(ctx.owner, ctx.repo.name, token)
    )
  } catch (error) {
    warnings.push(`Could not enable GitHub Issues: ${formatStepError(error)}`)
  }

  try {
    const labels = await withRepoToken(ctx.tokens, (token) =>
      createLabels(
        ctx.owner,
        ctx.repo.name,
        collectIssueLabels(ctx.brief),
        token
      )
    )

    if (labels.invalid > 0) {
      warnings.push(
        `Skipped ${labels.invalid} invalid label name(s) from the launch brief.`
      )
    }

    return {
      labelsCreated: labels.created,
      labelsSkipped: labels.skipped,
      warnings,
    }
  } catch (error) {
    warnings.push(`Could not create labels: ${formatStepError(error)}`)
    return { labelsCreated: 0, labelsSkipped: 0, warnings }
  }
}

export async function bootstrapMilestones(ctx: BootstrapContext): Promise<{
  milestonesCreated: number
  milestoneMap: MilestoneMap
  warnings: string[]
}> {
  const warnings: string[] = []

  try {
    const milestones = await withRepoToken(ctx.tokens, (token) =>
      createMilestones(
        ctx.owner,
        ctx.repo.name,
        ctx.brief.milestones,
        token
      )
    )

    return {
      milestonesCreated: milestones.created + milestones.reused,
      milestoneMap: milestones.map,
      warnings,
    }
  } catch (error) {
    warnings.push(`Could not create milestones: ${formatStepError(error)}`)
    return {
      milestonesCreated: 0,
      milestoneMap: new Map(),
      warnings,
    }
  }
}

export async function bootstrapIssues(
  ctx: BootstrapContext,
  milestoneMap: MilestoneMap
): Promise<Pick<BootstrapResult, "issues" | "warnings">> {
  const warnings: string[] = []

  try {
    const issues = await withRepoToken(ctx.tokens, (token) =>
      createIssues(
        ctx.owner,
        ctx.repo.name,
        generateIssueBodies(ctx.brief),
        ctx.brief.milestones,
        milestoneMap,
        token
      )
    )

    return { issues, warnings }
  } catch (error) {
    warnings.push(`Could not create issues: ${formatStepError(error)}`)
    return { issues: [], warnings }
  }
}

export async function bootstrapRepository(
  brief: LaunchBrief,
  repo: RepositoryRef,
  installationId: number,
  githubLogin: string,
  userAccessToken?: string,
  options?: { skipFiles?: boolean }
): Promise<BootstrapResult> {
  const ctx = await createBootstrapContext(
    brief,
    repo,
    installationId,
    githubLogin,
    userAccessToken
  )

  const files = await bootstrapCommitFiles(ctx, { skip: options?.skipFiles })
  const labels = await bootstrapLabels(ctx)
  const milestones = await bootstrapMilestones(ctx)
  const issues = await bootstrapIssues(ctx, milestones.milestoneMap)

  return {
    filesCommitted: files.filesCommitted,
    filePaths: files.filePaths,
    labelsCreated: labels.labelsCreated,
    labelsSkipped: labels.labelsSkipped,
    milestonesCreated: milestones.milestonesCreated,
    issues: issues.issues,
    warnings: [
      ...files.warnings,
      ...labels.warnings,
      ...milestones.warnings,
      ...issues.warnings,
    ],
  }
}

export { createBootstrapContext }

export function serializeMilestoneMap(map: MilestoneMap): Record<string, number> {
  return Object.fromEntries(map.entries())
}

export function deserializeMilestoneMap(
  value: Record<string, number> | undefined
): MilestoneMap {
  return new Map(Object.entries(value ?? {}))
}
