import { PrStatusBadges } from "@/components/dashboard/pr-status-badges"
import { formatRelativeTime } from "@/lib/aurora/format"
import { cn } from "@/lib/utils"

type PullRequestRow = {
  id: string
  prNumber: number
  title: string
  state: string
  branch: string | null
  sourceIssueNumber: number | null
  ciStatus: string | null
  bugbotStatus: string | null
  approvalStatus: string | null
  humanReviewRequired: boolean | null
  updatedAt: string
  url: string
  issueUrl: string | null
}

type PrListProps = {
  pullRequests: PullRequestRow[]
  className?: string
}

export function PrList({ pullRequests, className }: PrListProps) {
  const openPulls = pullRequests.filter((pull) => pull.state === "open")

  if (openPulls.length === 0) {
    return (
      <p className={cn("text-base text-muted-foreground", className)}>
        No open agent pull requests yet.
      </p>
    )
  }

  return (
    <ul className={cn("flex flex-col gap-4", className)}>
      {openPulls.map((pull) => (
        <li
          key={pull.id}
          className="border-b-2 border-border-subtle pb-4 last:border-b-0 last:pb-0"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <a
                className="text-lg text-primary underline-offset-4 hover:underline"
                href={pull.url}
                target="_blank"
                rel="noreferrer"
              >
                #{pull.prNumber} {pull.title}
              </a>
              {pull.sourceIssueNumber && pull.issueUrl ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  From{" "}
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href={pull.issueUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    issue #{pull.sourceIssueNumber}
                  </a>
                </p>
              ) : null}
              {pull.branch ? (
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {pull.branch}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm text-muted-foreground">
              {formatRelativeTime(pull.updatedAt)}
            </p>
          </div>
          <PrStatusBadges
            className="mt-3"
            ciStatus={pull.ciStatus}
            bugbotStatus={pull.bugbotStatus}
            approvalStatus={pull.approvalStatus}
            humanReviewRequired={pull.humanReviewRequired}
          />
        </li>
      ))}
    </ul>
  )
}
