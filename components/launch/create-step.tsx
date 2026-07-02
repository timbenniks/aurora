"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { CursorChecklist } from "@/components/launch/cursor-checklist"
import { LaunchStepper } from "@/components/launch/launch-stepper"
import { WorkspaceCreationProgress } from "@/components/launch/workspace-creation-progress"
import { EmptyState } from "@/components/empty-state"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { SummaryRow } from "@/components/summary-row"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { mobileCtaClass } from "@/lib/aurora/layout"
import { clearLaunchBrief } from "@/lib/launch/brief-storage"
import type { WorkspaceCreationResult } from "@/lib/launch/run-workspace-creation"
import { useLaunchBrief } from "@/lib/launch/use-launch-brief"
import { useWorkspaceCreation } from "@/lib/launch/use-workspace-creation"

type CreationSuccess = Extract<WorkspaceCreationResult, { ok: true }>

function CreateFrame({ children }: { children: React.ReactNode }) {
  return (
    <PageFrame>
      <PageHeader
        title="Create"
        description="Aurora creates the repository, commits setup files, and opens agent-ready issues on GitHub."
      />
      <LaunchStepper current="create" />
      {children}
    </PageFrame>
  )
}

function briefHeadline(briefJson: string): string | null {
  try {
    const parsed = JSON.parse(briefJson) as {
      project?: { name?: string; repo_name?: string }
    }

    if (parsed.project?.name && parsed.project?.repo_name) {
      return `${parsed.project.name} → ${parsed.project.repo_name}`
    }
  } catch {
    // Draft is validated before this step; a parse failure only means we
    // skip the headline.
  }

  return null
}

function CreationResult({
  result,
  onRetry,
  isRetrying,
}: {
  result: CreationSuccess
  onRetry: () => void
  isRetrying: boolean
}) {
  const hasWarnings = result.bootstrap.warnings.length > 0

  function handleContinue() {
    clearLaunchBrief()
  }

  return (
    <>
      {hasWarnings ? (
        <Panel interactive={false} className="border-warning/40">
          <h2 className="text-sm text-warning">Bootstrap warnings</h2>
          <ul className="mt-3 flex flex-col gap-2 text-lg text-warning">
            {result.bootstrap.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <Button
            className="mt-4"
            type="button"
            disabled={isRetrying}
            onClick={onRetry}
          >
            {isRetrying ? "Retrying setup…" : "Retry GitHub setup"}
          </Button>
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel interactive={false}>
          <h2 className="text-sm text-muted-foreground">Repository</h2>
          <dl className="mt-4">
            <SummaryRow label="Repository" value={result.repo.fullName} />
            <SummaryRow label="Branch" value={result.repo.defaultBranch} />
            <SummaryRow
              label="Files committed"
              value={result.bootstrap.filesCommitted}
            />
            <SummaryRow
              label="Labels created"
              value={result.bootstrap.labelsCreated}
            />
            <SummaryRow
              label="Milestones created"
              value={result.bootstrap.milestonesCreated}
            />
            <SummaryRow
              label="Issues created"
              value={result.bootstrap.issues.length}
            />
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={result.repo.url} target="_blank">
              Open on GitHub
            </ButtonLink>
            {result.workspaceId ? (
              <ButtonLink
                variant="outline"
                href={`/workspaces/${result.workspaceId}?new=1`}
                onClick={handleContinue}
              >
                Open workspace
              </ButtonLink>
            ) : null}
          </div>
        </Panel>

        <Panel interactive={false}>
          <CursorChecklist
            firstIssue={result.handoff.firstIssue}
            agentCommand={result.handoff.agentCommand}
          />
        </Panel>
      </div>
    </>
  )
}

export function CreateStep() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { briefJson, isValidated } = useLaunchBrief()
  const { create, progressSteps, isSubmitting, error } = useWorkspaceCreation()
  const [result, setResult] = useState<CreationSuccess | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const headline = useMemo(() => briefHeadline(briefJson), [briefJson])

  const signedIn = status === "authenticated" && Boolean(session?.user)
  const hasInstallation = Boolean(session?.githubInstallationId)

  async function handleCreate() {
    const created = await create(briefJson)

    if (!created) {
      return
    }

    if (created.bootstrap.warnings.length === 0 && created.workspaceId) {
      clearLaunchBrief()
      router.replace(`/workspaces/${created.workspaceId}?new=1`)
      return
    }

    setResult(created)
  }

  async function handleRetry() {
    setIsRetrying(true)

    try {
      const retried = await create(briefJson, { bootstrapOnly: true })

      if (retried) {
        setResult(retried)
      }
    } finally {
      setIsRetrying(false)
    }
  }

  if (!isValidated) {
    return (
      <CreateFrame>
        <EmptyState
          title="No validated launch brief"
          description="Validate a launch brief in the Brief step first. Aurora only creates repositories from validated briefs."
          action={
            <ButtonLink className="mt-6" href="/launch/new/brief">
              Go to Brief step
            </ButtonLink>
          }
        />
      </CreateFrame>
    )
  }

  if (result) {
    return (
      <CreateFrame>
        <CreationResult
          result={result}
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      </CreateFrame>
    )
  }

  if (status !== "loading" && (!signedIn || !hasInstallation)) {
    return (
      <CreateFrame>
        <Panel interactive={false}>
          <p className="text-lg text-muted-foreground">
            {signedIn
              ? "Install the Aurora GitHub App before creating a repository."
              : "Sign in with GitHub before creating a repository."}
          </p>
          <ButtonLink className="mt-4" href="/launch/new/connect">
            Go to Connect step
          </ButtonLink>
        </Panel>
      </CreateFrame>
    )
  }

  return (
    <CreateFrame>
      <Panel interactive={false}>
        <h2 className="text-sm leading-relaxed">Ready to create</h2>
        {headline ? (
          <p className="mt-3 text-xl text-muted-foreground">{headline}</p>
        ) : null}
        <p className="mt-2 text-base text-muted-foreground">
          This usually takes 20–40 seconds. If it is interrupted, running it
          again resumes after the steps that already finished.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button
            className={mobileCtaClass}
            type="button"
            disabled={status === "loading" || isSubmitting}
            onClick={handleCreate}
          >
            {isSubmitting ? "Working on GitHub…" : "Create repository"}
          </Button>
          <ButtonLink
            className={mobileCtaClass}
            variant="outline"
            href="/launch/new/review"
          >
            Back to Review
          </ButtonLink>
        </div>

        {isSubmitting && progressSteps && progressSteps.length > 0 ? (
          <div className="mt-6 border-t-2 border-border-subtle pt-6">
            <WorkspaceCreationProgress steps={progressSteps} />
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-base text-destructive">{error}</p>
        ) : null}
      </Panel>
    </CreateFrame>
  )
}
