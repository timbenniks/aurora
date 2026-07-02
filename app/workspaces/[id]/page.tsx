import { notFound } from "next/navigation"

import { NewWorkspaceBanner } from "@/components/dashboard/new-workspace-banner"
import { WorkspaceDetailView } from "@/components/dashboard/workspace-detail"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { ButtonLink } from "@/components/ui/button-link"
import { getCursorApiKeyFromEnv } from "@/lib/cursor/env"
import { getWorkspaceForUser } from "@/lib/aurora/workspaces"
import { requireSessionUser } from "@/lib/auth/session-user"

type WorkspaceDetailPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ new?: string }>
}

export default async function WorkspaceDetailPage({
  params,
  searchParams,
}: WorkspaceDetailPageProps) {
  const sessionUser = await requireSessionUser()
  const { id } = await params
  const { new: isNew } = await searchParams

  if ("error" in sessionUser) {
    notFound()
  }

  const workspace = await getWorkspaceForUser(id, sessionUser.githubUserId)

  if (!workspace) {
    notFound()
  }

  const cursorConnected = Boolean(getCursorApiKeyFromEnv())

  return (
    <PageFrame>
      <PageHeader
        title={workspace.repo}
        description={workspace.fullName}
        action={
          <ButtonLink variant="outline" href="/workspaces">
            All workspaces
          </ButtonLink>
        }
      />

      {isNew === "1" ? (
        <NewWorkspaceBanner
          cursorConnected={cursorConnected}
          fullName={workspace.fullName}
          firstTask={workspace.tasks[0]}
        />
      ) : null}

      <WorkspaceDetailView
        cursorConnected={cursorConnected}
        workspace={workspace}
      />
    </PageFrame>
  )
}
