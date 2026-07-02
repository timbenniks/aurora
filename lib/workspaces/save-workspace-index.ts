import type { LaunchBrief } from "@/lib/aurora/types"
import { persistWorkspaceFromBootstrap } from "@/lib/aurora/workspaces"
import { requireSessionUser } from "@/lib/auth/session-user"
import { getInstallationAccount } from "@/lib/github/installation"
import type { RepositoryRef } from "@/lib/github/repos"
import { bootstrapSnapshotFromBrief } from "@/lib/workspaces/bootstrap-snapshot"
import type { BootstrapResult } from "@/lib/workspaces/bootstrap-repository"
import {
  deserializeRepositoryRef,
  type SerializedRepositoryRef,
} from "@/lib/workspaces/workspace-create-steps"

type CreatedFrom = "launch_brief" | "existing_repo" | "imported"

export async function saveWorkspaceIndex(input: {
  installationId: number
  brief: LaunchBrief
  repo: RepositoryRef | SerializedRepositoryRef
  bootstrap: Partial<BootstrapResult>
  bootstrapOnly?: boolean
  createdFrom?: CreatedFrom
}): Promise<{ workspaceId: string } | { error: string; code: string }> {
  const sessionUser = await requireSessionUser()

  if ("error" in sessionUser) {
    return { error: sessionUser.error, code: sessionUser.code ?? "unauthorized" }
  }

  const repo =
    "url" in input.repo && "defaultBranch" in input.repo
      ? input.repo
      : deserializeRepositoryRef(input.repo)

  const bootstrap = bootstrapSnapshotFromBrief(
    input.brief,
    input.bootstrap,
    { bootstrapOnly: input.bootstrapOnly }
  )

  const installationAccount = await getInstallationAccount(input.installationId)

  const { workspaceId } = await persistWorkspaceFromBootstrap({
    user: sessionUser,
    installationId: input.installationId,
    installationAccount,
    brief: input.brief,
    repo,
    bootstrap,
    createdFrom: input.createdFrom ?? "launch_brief",
  })

  return { workspaceId }
}
