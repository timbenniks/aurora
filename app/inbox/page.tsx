import { InboxView } from "@/components/inbox/inbox-view"
import { EmptyState } from "@/components/empty-state"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { ButtonLink } from "@/components/ui/button-link"
import { getInboxForUser } from "@/lib/aurora/inbox"
import { auth } from "@/auth"

export default async function InboxPage() {
  const session = await auth()

  if (!session?.githubUserId) {
    return (
      <PageFrame>
        <PageHeader
          title="Merge inbox"
          description="Pull requests ready to review across your Aurora workspaces."
        />
        <EmptyState
          title="Sign in to see your inbox"
          description="Connect GitHub in Settings to track agent pull requests overnight."
          action={
            <ButtonLink className="mt-6" href="/settings">
              Go to Settings
            </ButtonLink>
          }
        />
      </PageFrame>
    )
  }

  const inbox = await getInboxForUser(session.githubUserId)

  return (
    <PageFrame>
      <PageHeader
        title="Merge inbox"
        description="Pull requests across your workspaces, sorted by what needs your attention."
        action={
          <ButtonLink variant="outline" href="/workspaces">
            Workspaces
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel interactive={false}>
          <p className="text-sm text-muted-foreground">Ready to merge</p>
          <p className="mt-2 text-3xl tabular-nums text-success">
            {inbox.summary.readyCount}
          </p>
        </Panel>
        <Panel interactive={false}>
          <p className="text-sm text-muted-foreground">Needs review</p>
          <p className="mt-2 text-3xl tabular-nums text-warning">
            {inbox.summary.needsReviewCount}
          </p>
        </Panel>
        <Panel interactive={false}>
          <p className="text-sm text-muted-foreground">In progress</p>
          <p className="mt-2 text-3xl tabular-nums">{inbox.summary.inProgressCount}</p>
        </Panel>
      </div>

      <InboxView
        className="mt-6"
        ready={inbox.ready}
        needsReview={inbox.needsReview}
        inProgress={inbox.inProgress}
      />
    </PageFrame>
  )
}
