import { getInstallationAccessToken } from "@/lib/github/app-auth"
import { scanRepositorySetupFiles } from "@/lib/github/scan-repository"
import {
  applyReadinessToWorkspace,
  findWorkspaceByGithubRepoId,
  updateWorkspaceActivity,
} from "@/lib/github/workspace-index"

type GitHubRepository = {
  id: number
  default_branch?: string
}

type PushPayload = {
  ref: string
  repository: GitHubRepository
}

export async function handlePushWebhook(payload: PushPayload) {
  const workspace = await findWorkspaceByGithubRepoId(payload.repository.id)

  if (!workspace) {
    return { handled: false, reason: "workspace_not_found" }
  }

  const defaultBranch = payload.repository.default_branch ?? "main"
  const branchRef = `refs/heads/${defaultBranch}`

  if (payload.ref !== branchRef) {
    return { handled: true, workspaceId: workspace.id, skipped: "non_default_branch" }
  }

  const token = await getInstallationAccessToken(
    workspace.installation.githubInstallationId
  )

  const scan = await scanRepositorySetupFiles({
    owner: workspace.owner,
    repo: workspace.repo,
    defaultBranch,
    token,
  })

  await applyReadinessToWorkspace(workspace.id, scan.existingPaths)
  await updateWorkspaceActivity(workspace.id)

  return { handled: true, workspaceId: workspace.id, readiness: scan.readiness.score }
}
