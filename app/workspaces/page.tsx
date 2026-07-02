import { WorkspaceOverviewSection } from "@/components/dashboard/workspace-overview-section"
import { DeletedWorkspaceBanner } from "@/components/dashboard/deleted-workspace-banner"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { ButtonLink } from "@/components/ui/button-link"
import { getDashboardWorkspaces } from "@/lib/aurora/dashboard"

type WorkspacesPageProps = {
  searchParams: Promise<{ deleted?: string }>
}

export default async function WorkspacesPage({
  searchParams,
}: WorkspacesPageProps) {
  const { deleted } = await searchParams
  const { workspaces } = await getDashboardWorkspaces()

  return (
    <PageFrame>
      <PageHeader
        title="Workspaces"
        description="Aurora-enabled repositories you have launched."
        action={<ButtonLink href="/launch">Create project</ButtonLink>}
      />

      {deleted === "1" ? (
        <div className="mb-6">
          <DeletedWorkspaceBanner />
        </div>
      ) : null}

      <WorkspaceOverviewSection workspaces={workspaces} />
    </PageFrame>
  )
}
