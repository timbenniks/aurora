import type { LaunchBrief, ValidationMessage } from "@/lib/aurora/types"
import { generateAllFiles } from "@/lib/aurora/generate-files"
import { getDefaultLabels } from "@/lib/aurora/labels"
import { GitHubApiError, githubApiRequest } from "@/lib/github/client"
import { mapGitHubError } from "@/lib/github/errors"
import { createRepository, type RepositoryRef } from "@/lib/github/repos"
import {
  resolveRepoAccessTokens,
  resolveRepoOwner,
} from "@/lib/github/token"
import { withRepoToken } from "@/lib/github/with-repo-token"
import {
  bootstrapCommitFiles,
  bootstrapIssues,
  bootstrapLabels,
  bootstrapMilestones,
  createBootstrapContext,
  deserializeMilestoneMap,
  type BootstrapResult,
  serializeMilestoneMap,
} from "@/lib/workspaces/bootstrap-repository"
import {
  deserializeRepositoryRef,
  parseAndValidateBrief,
  serializeRepositoryRef,
  type BriefCreationSummary,
  type SerializedRepositoryRef,
  type WorkspaceCreateStep,
} from "@/lib/workspaces/workspace-create-steps"

export type CreateWorkspaceFromBriefResult =
  | {
      ok: true
      brief: LaunchBrief
      repo: RepositoryRef
      bootstrap: BootstrapResult
    }
  | {
      ok: false
      status: number
      code: string
      error: string
      errors?: ValidationMessage[]
      repo?: RepositoryRef
      bootstrap?: BootstrapResult
    }

export type WorkspaceStepResult =
  | {
      ok: true
      step: WorkspaceCreateStep
      brief: LaunchBrief
      summary: BriefCreationSummary
      repo: SerializedRepositoryRef
      milestoneMap?: Record<string, number>
      partial?: Partial<BootstrapResult>
    }
  | {
      ok: false
      status: number
      code: string
      error: string
      errors?: Array<{ code: string; message: string; path: string }>
      repo?: SerializedRepositoryRef
      partial?: Partial<BootstrapResult>
    }

type GitHubRepoMeta = {
  id: number
  name: string
  full_name: string
  html_url: string
  size: number
  default_branch: string | null
  owner: { login: string }
}

async function getRepositoryMeta(
  owner: string,
  name: string,
  tokens: { primary: string; fallback?: string }
): Promise<GitHubRepoMeta | null> {
  try {
    return await withRepoToken(tokens, (token) =>
      githubApiRequest<GitHubRepoMeta>(`/repos/${owner}/${name}`, token)
    )
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

function toRepositoryRef(
  meta: GitHubRepoMeta,
  defaultBranch: string
): RepositoryRef {
  return {
    id: meta.id,
    owner: meta.owner.login,
    name: meta.name,
    fullName: meta.full_name,
    url: meta.html_url,
    defaultBranch: meta.default_branch ?? defaultBranch,
  }
}

function emptyBootstrapPartial(): Partial<BootstrapResult> {
  return {
    filesCommitted: 0,
    filePaths: [],
    labelsCreated: 0,
    labelsSkipped: 0,
    milestonesCreated: 0,
    issues: [],
    warnings: [],
  }
}

function mergePartial(
  base: Partial<BootstrapResult>,
  patch: Partial<BootstrapResult>
): Partial<BootstrapResult> {
  return {
    ...base,
    ...patch,
    warnings: [...(base.warnings ?? []), ...(patch.warnings ?? [])],
    issues: patch.issues ?? base.issues,
    filePaths: patch.filePaths ?? base.filePaths,
  }
}

async function resolveOrCreateRepo(
  brief: LaunchBrief,
  installationId: number,
  githubLogin: string,
  userAccessToken: string | undefined,
  bootstrapOnly: boolean
): Promise<RepositoryRef> {
  const access = await resolveRepoAccessTokens(
    installationId,
    githubLogin,
    userAccessToken
  )
  const tokens = { primary: access.primary, fallback: access.fallback }
  const repoOwner = resolveRepoOwner(
    access.account,
    githubLogin,
    access.account.login
  )
  const existing = await getRepositoryMeta(
    repoOwner,
    brief.project.repo_name,
    tokens
  )

  if (existing) {
    if (existing.size > 0 && !bootstrapOnly) {
      throw new GitHubApiError(
        "A repository with this name already exists and is not empty.",
        409,
        { code: "duplicate_repo_name" }
      )
    }

    const repo = toRepositoryRef(existing, brief.workflow.default_branch)
    repo.owner = resolveRepoOwner(access.account, githubLogin, repo.owner)
    return repo
  }

  if (bootstrapOnly) {
    throw new GitHubApiError("Repository does not exist yet.", 404, {
      code: "repo_not_found",
    })
  }

  const repo = await createRepository({
    installationId,
    name: brief.project.repo_name,
    description: brief.project.description,
    visibility: brief.project.visibility,
    defaultBranch: brief.workflow.default_branch,
    userAccessToken,
  })

  repo.owner = resolveRepoOwner(access.account, githubLogin, repo.owner)
  return repo
}

export async function runWorkspaceCreateStep(
  step: WorkspaceCreateStep,
  launchBrief: unknown,
  installationId: number,
  githubLogin: string,
  userAccessToken: string | undefined,
  options?: {
    repo?: SerializedRepositoryRef
    milestoneMap?: Record<string, number>
    bootstrapOnly?: boolean
    skipFiles?: boolean
  }
): Promise<WorkspaceStepResult> {
  const validated = parseAndValidateBrief(launchBrief)

  if (!validated.ok) {
    return {
      ok: false,
      status: validated.status,
      code: validated.code,
      error: validated.error,
      errors: validated.errors,
    }
  }

  const { brief, summary } = validated

  try {
    if (step === "repo") {
      const repo = await resolveOrCreateRepo(
        brief,
        installationId,
        githubLogin,
        userAccessToken,
        options?.bootstrapOnly === true
      )

      return {
        ok: true,
        step,
        brief,
        summary: {
          ...summary,
          fileCount: generateAllFiles(brief).length,
          labelCount: getDefaultLabels().length,
        },
        repo: serializeRepositoryRef(repo),
      }
    }

    if (!options?.repo) {
      return {
        ok: false,
        status: 400,
        code: "missing_repo",
        error: "Repository context is required for this step.",
      }
    }

    const repo = deserializeRepositoryRef(options.repo)
    const ctx = await createBootstrapContext(
      brief,
      repo,
      installationId,
      githubLogin,
      userAccessToken
    )

    if (step === "files") {
      const result = await bootstrapCommitFiles(ctx, {
        skip: options.skipFiles,
      })

      if (result.filesCommitted === 0 && !options.skipFiles) {
        return {
          ok: false,
          status: 500,
          code: "bootstrap_failed",
          error: result.warnings[0] ?? "Could not commit setup files.",
          repo: options.repo,
          partial: mergePartial(emptyBootstrapPartial(), result),
        }
      }

      return {
        ok: true,
        step,
        brief,
        summary,
        repo: options.repo,
        partial: result,
      }
    }

    if (step === "labels") {
      const result = await bootstrapLabels(ctx)

      return {
        ok: true,
        step,
        brief,
        summary,
        repo: options.repo,
        partial: result,
      }
    }

    if (step === "milestones") {
      const result = await bootstrapMilestones(ctx)

      return {
        ok: true,
        step,
        brief,
        summary,
        repo: options.repo,
        milestoneMap: serializeMilestoneMap(result.milestoneMap),
        partial: {
          milestonesCreated: result.milestonesCreated,
          warnings: result.warnings,
        },
      }
    }

    const milestoneMap = deserializeMilestoneMap(options.milestoneMap)
    const result = await bootstrapIssues(ctx, milestoneMap)

    return {
      ok: true,
      step,
      brief,
      summary,
      repo: options.repo,
      partial: result,
    }
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return {
        ok: false,
        status: error.status,
        code: error.code ?? "github_error",
        error: error.message,
        repo: options?.repo,
      }
    }

    const mapped = mapGitHubError(error)

    return {
      ok: false,
      status: mapped.status,
      code: mapped.code,
      error: mapped.message,
      repo: options?.repo,
    }
  }
}

function bootstrapFailureMessage(bootstrap: BootstrapResult): string {
  const detail = bootstrap.warnings[0]

  if (detail) {
    return `Aurora could not finish bootstrapping the repository. ${detail}`
  }

  return "Aurora could not finish bootstrapping the repository."
}

export async function createWorkspaceFromBrief(
  launchBrief: unknown,
  installationId: number,
  githubLogin: string,
  userAccessToken?: string,
  options?: { bootstrapOnly?: boolean }
): Promise<CreateWorkspaceFromBriefResult> {
  const steps: WorkspaceCreateStep[] = options?.bootstrapOnly
    ? ["repo", "labels", "milestones", "issues"]
    : ["repo", "files", "labels", "milestones", "issues"]

  let repo: SerializedRepositoryRef | undefined
  let milestoneMap: Record<string, number> | undefined
  let partial: Partial<BootstrapResult> = emptyBootstrapPartial()
  let brief: LaunchBrief | undefined

  for (const step of steps) {
    const result = await runWorkspaceCreateStep(
      step,
      launchBrief,
      installationId,
      githubLogin,
      userAccessToken,
      {
        repo,
        milestoneMap,
        bootstrapOnly: options?.bootstrapOnly,
        skipFiles: options?.bootstrapOnly && step === "files",
      }
    )

    if (!result.ok) {
      return {
        ok: false,
        status: result.status,
        code: result.code,
        error: result.error,
        errors: result.errors,
        repo: result.repo ? deserializeRepositoryRef(result.repo) : undefined,
        bootstrap: partial as BootstrapResult,
      }
    }

    brief = result.brief
    repo = result.repo
    milestoneMap = result.milestoneMap ?? milestoneMap

    if (result.partial) {
      partial = mergePartial(partial, result.partial)
    }
  }

  if (!brief || !repo) {
    return {
      ok: false,
      status: 500,
      code: "incomplete",
      error: "Workspace creation did not finish.",
    }
  }

  const bootstrap = partial as BootstrapResult

  if (bootstrap.filesCommitted === 0 && !options?.bootstrapOnly) {
    return {
      ok: false,
      status: 500,
      code: "bootstrap_failed",
      error: bootstrapFailureMessage(bootstrap),
      repo: deserializeRepositoryRef(repo),
      bootstrap,
    }
  }

  return {
    ok: true,
    brief,
    repo: deserializeRepositoryRef(repo),
    bootstrap,
  }
}

/** @deprecated Use createWorkspaceFromBrief */
export const createRepositoryFromBrief = createWorkspaceFromBrief

export type CreateRepositoryFromBriefResult = CreateWorkspaceFromBriefResult
