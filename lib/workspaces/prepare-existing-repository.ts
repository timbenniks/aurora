import type { LaunchBrief } from "@/lib/aurora/types"
import { generateAllFiles } from "@/lib/aurora/generate-files"
import {
  findWorkspaceByGithubRepoId,
  persistWorkspaceFromBootstrap,
  type SessionUserInput,
} from "@/lib/aurora/workspaces"
import { createBranchFromDefault, createSetupBranchName } from "@/lib/github/branches"
import { commitFiles } from "@/lib/github/commits"
import { GitHubApiError, githubApiRequest } from "@/lib/github/client"
import { mapGitHubError } from "@/lib/github/errors"
import { getInstallationAccount, type InstallationAccount } from "@/lib/github/installation"
import {
  buildSetupPullRequestBody,
  createPullRequest,
  type CreatedPullRequest,
} from "@/lib/github/pull-requests"
import type { RepositoryRef } from "@/lib/github/repos"
import {
  scanRepositorySetupFiles,
  type RepositoryScanResult,
} from "@/lib/github/scan-repository"
import {
  resolveRepoAccessTokens,
  resolveRepoOwner,
} from "@/lib/github/token"
import { withRepoToken } from "@/lib/github/with-repo-token"
import { parseAndValidateBrief } from "@/lib/workspaces/workspace-create-steps"

export type PrepareExistingRepositoryResult =
  | {
      ok: true
      repo: RepositoryRef
      scan: RepositoryScanResult
      workspaceId: string
      pullRequest?: CreatedPullRequest
      filesInPullRequest: string[]
      alreadyLinked: boolean
    }
  | {
      ok: false
      status: number
      code: string
      error: string
    }

type GitHubRepositoryResponse = {
  id: number
  name: string
  full_name: string
  html_url: string
  default_branch: string | null
  owner: { login: string }
}

async function fetchRepositoryRef(input: {
  installationId: number
  githubLogin: string
  userAccessToken?: string
  owner: string
  name: string
}): Promise<RepositoryRef | null> {
  const access = await resolveRepoAccessTokens(
    input.installationId,
    input.githubLogin,
    input.userAccessToken
  )
  const owner = resolveRepoOwner(access.account, input.githubLogin, input.owner)

  try {
    return await withRepoToken(
      { primary: access.primary, fallback: access.fallback },
      async (token) => {
        const meta = await githubApiRequest<GitHubRepositoryResponse>(
          `/repos/${owner}/${input.name}`,
          token
        )

        return {
          id: meta.id,
          owner: meta.owner.login,
          name: meta.name,
          fullName: meta.full_name,
          url: meta.html_url,
          defaultBranch: meta.default_branch ?? "main",
        }
      }
    )
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

export async function prepareExistingRepository(input: {
  brief: LaunchBrief
  user: SessionUserInput
  installationId: number
  installationAccount: InstallationAccount
  githubLogin: string
  userAccessToken?: string
  owner: string
  name: string
  existingWorkspaceId?: string
}): Promise<PrepareExistingRepositoryResult> {
  const repo = await fetchRepositoryRef(input)

  if (!repo) {
    return {
      ok: false,
      status: 404,
      code: "repo_not_found",
      error: "Repository not found or not accessible to Aurora.",
    }
  }

  const access = await resolveRepoAccessTokens(
    input.installationId,
    input.githubLogin,
    input.userAccessToken
  )
  const owner = resolveRepoOwner(access.account, input.githubLogin, repo.owner)

  const scan = await scanRepositorySetupFiles({
    owner,
    repo: repo.name,
    defaultBranch: repo.defaultBranch,
    token: access.primary,
  })

  const generated = generateAllFiles(input.brief)
  const missingSet = new Set(scan.missingPaths)
  const filesToAdd = generated.filter((file) => missingSet.has(file.path))

  let pullRequest: CreatedPullRequest | undefined
  const filesInPullRequest = filesToAdd.map((file) => file.path)

  if (filesToAdd.length > 0) {
    const branchName = createSetupBranchName()

    await withRepoToken(
      { primary: access.primary, fallback: access.fallback },
      async (token) => {
        await createBranchFromDefault(
          owner,
          repo.name,
          repo.defaultBranch,
          branchName,
          token
        )

        await commitFiles(
          owner,
          repo.name,
          branchName,
          filesToAdd,
          "Add Aurora agent workflow files",
          token
        )

        pullRequest = await createPullRequest({
          owner,
          repo: repo.name,
          title: "Add Aurora agent workflow files",
          head: branchName,
          base: repo.defaultBranch,
          body: buildSetupPullRequestBody({
            files: filesInPullRequest,
            projectName: input.brief.project.name,
          }),
          token,
        })
      }
    )
  }

  const { workspaceId } = await persistWorkspaceFromBootstrap({
    user: input.user,
    installationId: input.installationId,
    installationAccount: input.installationAccount,
    brief: input.brief,
    repo: { ...repo, owner },
    bootstrap: {
      filesCommitted: scan.existingPaths.length,
      filePaths: scan.existingPaths,
      labelsCreated: 0,
      labelsSkipped: 0,
      milestonesCreated: 0,
      issues: [],
      warnings: [],
    },
    createdFrom: "existing_repo",
  })

  return {
    ok: true,
    repo: { ...repo, owner },
    scan,
    workspaceId,
    pullRequest,
    filesInPullRequest,
    alreadyLinked: Boolean(input.existingWorkspaceId),
  }
}

export async function runPrepareExistingRepository(
  launchBrief: unknown,
  installationId: number,
  githubLogin: string,
  userAccessToken: string | undefined,
  owner: string,
  name: string,
  user: SessionUserInput
): Promise<PrepareExistingRepositoryResult> {
  const validated = parseAndValidateBrief(launchBrief)

  if (!validated.ok) {
    return {
      ok: false,
      status: validated.status,
      code: validated.code,
      error: validated.error,
    }
  }

  try {
    const repoMeta = await fetchRepositoryRef({
      installationId,
      githubLogin,
      userAccessToken,
      owner,
      name,
    })

    if (!repoMeta) {
      return {
        ok: false,
        status: 404,
        code: "repo_not_found",
        error: "Repository not found or not accessible to Aurora.",
      }
    }

    const existingWorkspace = await findWorkspaceByGithubRepoId(
      repoMeta.id,
      user.githubUserId
    )

    const installationAccount = await getInstallationAccount(installationId)

    return await prepareExistingRepository({
      brief: validated.brief,
      user,
      installationId,
      installationAccount,
      githubLogin,
      userAccessToken,
      owner,
      name,
      existingWorkspaceId: existingWorkspace?.id,
    })
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return {
        ok: false,
        status: error.status,
        code: error.code ?? "github_error",
        error: error.message,
      }
    }

    const mapped = mapGitHubError(error)

    return {
      ok: false,
      status: mapped.status,
      code: mapped.code,
      error: mapped.message,
    }
  }
}
