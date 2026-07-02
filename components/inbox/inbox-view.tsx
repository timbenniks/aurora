import { PrStatusBadges } from "@/components/dashboard/pr-status-badges"
import { formatRelativeTime } from "@/lib/aurora/format"
import type { InboxPullRequest } from "@/lib/aurora/inbox"
import { cn } from "@/lib/utils"

type InboxSectionProps = {
  title: string
  description: string
  items: InboxPullRequest[]
  emptyMessage: string
}

function InboxSection({
  title,
  description,
  items,
  emptyMessage,
}: InboxSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm leading-relaxed">{title}</h2>
        <p className="mt-1 text-base text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-base text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-2 border-[#1a2540] p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{item.repoFullName}</p>
                  <a
                    className="mt-1 block text-lg text-primary underline-offset-4 hover:underline"
                    href={item.prUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    #{item.prNumber} {item.title}
                  </a>
                  {item.issueUrl ? (
                    <a
                      className="mt-1 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                      href={item.issueUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Issue #{item.sourceIssueNumber}
                    </a>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm text-muted-foreground">
                  {formatRelativeTime(item.updatedAt)}
                </p>
              </div>
              <PrStatusBadges
                className="mt-3"
                ciStatus={item.ciStatus}
                bugbotStatus={item.bugbotStatus}
                approvalStatus={item.approvalStatus}
                humanReviewRequired={item.humanReviewRequired}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

type InboxViewProps = {
  ready: InboxPullRequest[]
  needsReview: InboxPullRequest[]
  inProgress: InboxPullRequest[]
  className?: string
}

export function InboxView({
  ready,
  needsReview,
  inProgress,
  className,
}: InboxViewProps) {
  const isEmpty =
    ready.length === 0 && needsReview.length === 0 && inProgress.length === 0

  if (isEmpty) {
    return (
      <div className={cn("border-2 border-dashed border-[#1a2540] p-8 text-center", className)}>
        <p className="text-lg">No pull requests yet</p>
        <p className="mx-auto mt-2 max-w-md text-base text-muted-foreground">
          Create issues before bed and let Cursor agents work overnight. Open PRs
          will appear here when they are ready to review.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <InboxSection
        title="Ready to merge"
        description="CI is green and no human review is blocking these PRs."
        items={ready}
        emptyMessage="Nothing ready to merge right now."
      />
      <InboxSection
        title="Needs your review"
        description="Failed checks, approval blocks, or explicit human review required."
        items={needsReview}
        emptyMessage="No PRs waiting on you."
      />
      <InboxSection
        title="In progress"
        description="Checks still running or agents are still working."
        items={inProgress}
        emptyMessage="No in-progress PRs."
      />
    </div>
  )
}
