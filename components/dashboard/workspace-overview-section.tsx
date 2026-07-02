import { ActivityTimeline } from "@/components/dashboard/activity-timeline"
import { EmptyWorkspaces } from "@/components/dashboard/empty-workspaces"
import { WorkspaceCard } from "@/components/dashboard/workspace-card"
import { WorkspaceGrid } from "@/components/dashboard/workspace-grid"

type WorkspaceOverviewSectionProps = {
  workspaces: Parameters<typeof WorkspaceCard>[0]["workspace"][]
  limit?: number
}

export function WorkspaceOverviewSection({
  workspaces,
  limit,
}: WorkspaceOverviewSectionProps) {
  const visible = limit ? workspaces.slice(0, limit) : workspaces

  if (visible.length === 0) {
    return <EmptyWorkspaces />
  }

  const activityItems = visible
    .flatMap((workspace) =>
      workspace.openAgentTasks > 0
        ? [
            {
              id: workspace.id,
              title: `${workspace.fullName} — ${workspace.openAgentTasks} open tasks`,
              timestamp: workspace.lastActivityAt,
            },
          ]
        : []
    )
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceGrid>
        {visible.map((workspace) => (
          <WorkspaceCard key={workspace.id} workspace={workspace} />
        ))}
      </WorkspaceGrid>

      {activityItems.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm leading-relaxed">Recent activity</h2>
          <ActivityTimeline items={activityItems} />
        </section>
      ) : null}
    </div>
  )
}
