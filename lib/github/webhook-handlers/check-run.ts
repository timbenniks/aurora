import { getInstallationAccessToken } from "@/lib/github/app-auth"
import {
  findWorkspaceByGithubRepoId,
  refreshWorkspacePrCounts,
  updatePullRequestCiStatus,
  updateWorkspaceActivity,
} from "@/lib/github/workspace-index"

type CheckRunPayload = {
  action: string
  check_run: {
    status: string
    conclusion: string | null
    head_sha: string
  }
  repository: {
    id: number
    name: string
    owner: { login: string }
  }
}

function mapCheckConclusion(
  status: string,
  conclusion: string | null
): string | null {
  if (status !== "completed") {
    return "pending"
  }

  return conclusion ?? "neutral"
}

export async function handleCheckRunWebhook(payload: CheckRunPayload) {
  const workspace = await findWorkspaceByGithubRepoId(payload.repository.id)

  if (!workspace) {
    return { handled: false, reason: "workspace_not_found" }
  }

  const ciStatus = mapCheckConclusion(
    payload.check_run.status,
    payload.check_run.conclusion
  )

  if (!ciStatus) {
    return { handled: true, workspaceId: workspace.id, skipped: "no_conclusion" }
  }

  const token = await getInstallationAccessToken(
    workspace.installation.githubInstallationId
  )

  await updatePullRequestCiStatus({
    workspaceId: workspace.id,
    headSha: payload.check_run.head_sha,
    ciStatus,
    token,
    owner: workspace.owner,
    repo: workspace.repo,
  })

  await refreshWorkspacePrCounts(workspace.id)
  await updateWorkspaceActivity(workspace.id)

  return { handled: true, workspaceId: workspace.id, ciStatus }
}
