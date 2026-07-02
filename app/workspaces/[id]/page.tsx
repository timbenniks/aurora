import { notFound } from "next/navigation"

import { WorkspaceDetailView } from "@/components/dashboard/workspace-detail"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { ButtonLink } from "@/components/ui/button-link"
import { getWorkspaceForUser } from "@/lib/aurora/workspaces"
import { requireSessionUser } from "@/lib/auth/session-user"

type WorkspaceDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function WorkspaceDetailPage({
  params,
}: WorkspaceDetailPageProps) {
  const sessionUser = await requireSessionUser()
  const { id } = await params

  if ("error" in sessionUser) {
    notFound()
  }

  const workspace = await getWorkspaceForUser(id, sessionUser.githubUserId)

  if (!workspace) {
    notFound()
  }

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

      <WorkspaceDetailView workspace={workspace} />
    </PageFrame>
  )
}
