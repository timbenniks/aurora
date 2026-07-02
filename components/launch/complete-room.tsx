"use client"

import { useRouter } from "next/navigation"
import { useEffect, useSyncExternalStore } from "react"

import { CursorChecklist } from "@/components/launch/cursor-checklist"
import { RetryGithubSetupButton } from "@/components/launch/retry-github-setup-button"
import { EmptyState } from "@/components/empty-state"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { ButtonLink } from "@/components/ui/button-link"
import {
  getLaunchCompleteSnapshot,
  subscribeToLaunchComplete,
} from "@/lib/launch/complete-storage"
import { cn } from "@/lib/utils"

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col gap-1 border-b-2 border-[#1a2540] py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className="text-lg">{value}</dd>
    </div>
  )
}

export function CompleteRoom() {
  const router = useRouter()
  const data = useSyncExternalStore(
    subscribeToLaunchComplete,
    getLaunchCompleteSnapshot,
    () => null
  )

  useEffect(() => {
    if (data?.workspaceId) {
      router.replace(`/workspaces/${data.workspaceId}`)
    }
  }, [data?.workspaceId, router])

  if (data?.workspaceId) {
    return null
  }

  if (data === null) {
    return (
      <PageFrame>
        <PageHeader title="Launch complete" description="Nothing to show yet." />
        <EmptyState
          title="No launch result found"
          description="Create a repository from the preview screen first."
          action={
            <ButtonLink className="mt-6" href="/launch">
              Go to Launch room
            </ButtonLink>
          }
        />
      </PageFrame>
    )
  }

  const hasWarnings = data.bootstrap.warnings.length > 0

  return (
    <PageFrame>
      <PageHeader
        title="Launch complete"
        description={`${data.repo.fullName} is bootstrapped on ${data.repo.defaultBranch}.`}
        action={
          <div className="hidden flex-col gap-3 md:flex">
            <ButtonLink href={data.repo.url} target="_blank">
              Open on GitHub
            </ButtonLink>
            <ButtonLink variant="outline" href="/workspaces">
              Workspaces
            </ButtonLink>
          </div>
        }
      />

      {hasWarnings ? (
        <Panel interactive={false} className="mb-4 border-warning/40">
          <h2 className="text-sm text-warning">Bootstrap warnings</h2>
          <ul className="mt-3 flex flex-col gap-2 text-lg text-warning">
            {data.bootstrap.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <RetryGithubSetupButton className="mt-4" />
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel interactive={false}>
          <h2 className="text-sm text-muted-foreground">Repository</h2>
          <dl className="mt-4">
            <SummaryRow label="Repository" value={data.repo.fullName} />
            <SummaryRow label="Branch" value={data.repo.defaultBranch} />
            <SummaryRow
              label="Files committed"
              value={data.bootstrap.filesCommitted}
            />
            <SummaryRow label="Labels created" value={data.bootstrap.labelsCreated} />
            <SummaryRow
              label="Milestones created"
              value={data.bootstrap.milestonesCreated}
            />
            <SummaryRow label="Issues created" value={data.bootstrap.issues.length} />
          </dl>

          {data.bootstrap.issues.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm text-muted-foreground">Created issues</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {data.bootstrap.issues.map((issue) => (
                  <li key={issue.number}>
                    <a
                      className={cn(
                        "text-lg text-primary underline-offset-4 hover:underline"
                      )}
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      #{issue.number} {issue.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>

        <Panel interactive={false}>
          <CursorChecklist
            firstIssue={data.handoff.firstIssue}
            agentCommand={data.handoff.agentCommand}
          />
        </Panel>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:hidden">
        <ButtonLink href={data.repo.url} target="_blank">
          Open on GitHub
        </ButtonLink>
        <ButtonLink variant="outline" href="/workspaces">
          Workspaces
        </ButtonLink>
      </div>
    </PageFrame>
  )
}
