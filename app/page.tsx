import { WorkspaceOverviewSection } from "@/components/dashboard/workspace-overview-section"
import { EmptyState } from "@/components/empty-state"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { FeaturePanel, Panel } from "@/components/panel"
import { ButtonLink } from "@/components/ui/button-link"
import { getInboxSummaryForUser } from "@/lib/aurora/inbox"
import { getDashboardWorkspaces } from "@/lib/aurora/dashboard"
import { auth } from "@/auth"

export default async function OverviewPage() {
  const { signedIn, workspaces } = await getDashboardWorkspaces()
  const session = await auth()
  const inboxSummary =
    session?.githubUserId != null
      ? await getInboxSummaryForUser(session.githubUserId)
      : null

  return (
    <PageFrame>
      <PageHeader
        title="Overview"
        description="Create agent-ready GitHub repositories from a launch brief, then hand off to Cursor."
        action={<ButtonLink href="/launch/new/brief">Create project</ButtonLink>}
      />

      <FeaturePanel
        title="Welcome"
        description="Aurora turns a validated launch brief into a GitHub repo with setup files, labels, milestones, and agent-ready issues. Start a new project to get going."
      >
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ButtonLink href="/launch/new/brief">Create new project</ButtonLink>
          <ButtonLink href="/launch/prepare-existing" variant="outline">
            Prepare existing repo
          </ButtonLink>
        </div>
      </FeaturePanel>

      {signedIn && inboxSummary ? (
        <Panel interactive={false}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ready to merge</p>
              <p className="mt-2 text-4xl tabular-nums text-success">
                {inboxSummary.readyCount}
              </p>
              <p className="mt-2 text-base text-muted-foreground">
                {inboxSummary.readyCount === 1
                  ? "PR is ready for your morning review."
                  : "PRs are ready for your morning review."}
              </p>
            </div>
            <ButtonLink href="/inbox">Open merge inbox</ButtonLink>
          </div>
        </Panel>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm leading-relaxed">Workspaces</h2>
          {workspaces.length > 0 ? (
            <ButtonLink variant="outline" href="/workspaces">
              View all
            </ButtonLink>
          ) : null}
        </div>

        {!signedIn ? (
          <EmptyState
            title="Sign in to see workspaces"
            description="Connect GitHub in Settings to create projects and track Aurora-enabled repositories."
            action={
              <ButtonLink className="mt-6" href="/settings">
                Go to Settings
              </ButtonLink>
            }
          />
        ) : (
          <WorkspaceOverviewSection workspaces={workspaces} limit={4} />
        )}
      </section>
    </PageFrame>
  )
}
