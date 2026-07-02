"use client"

import { useState } from "react"

import { WorkspaceCreationProgress } from "@/components/launch/workspace-creation-progress"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/panel"
import { mobileCtaClass } from "@/lib/aurora/layout"
import {
  loadLaunchBrief,
  loadLaunchBriefDraft,
} from "@/lib/launch/brief-storage"
import {
  saveLaunchComplete,
  type LaunchCompleteData,
} from "@/lib/launch/complete-storage"
import {
  runWorkspaceCreation,
  type CreationProgressStep,
} from "@/lib/launch/run-workspace-creation"

type RetryGithubSetupButtonProps = {
  className?: string
}

export function RetryGithubSetupButton({
  className,
}: RetryGithubSetupButtonProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progressSteps, setProgressSteps] = useState<CreationProgressStep[] | null>(
    null
  )

  async function handleRetry() {
    setIsSubmitting(true)
    setMessage(null)
    setProgressSteps([])

    const briefJson = loadLaunchBrief() ?? loadLaunchBriefDraft()

    if (!briefJson?.trim()) {
      setMessage("Launch brief not found. Go back to the Launch room.")
      setIsSubmitting(false)
      setProgressSteps(null)
      return
    }

    let launchBrief: unknown

    try {
      launchBrief = JSON.parse(briefJson)
    } catch {
      setMessage("Launch brief is not valid JSON.")
      setIsSubmitting(false)
      setProgressSteps(null)
      return
    }

    try {
      const result = await runWorkspaceCreation(
        launchBrief,
        (steps) => setProgressSteps(steps),
        { bootstrapOnly: true }
      )

      if (!result.ok) {
        setMessage(result.error ?? "Could not finish GitHub setup.")
        return
      }

      const complete: LaunchCompleteData = {
        workspaceId: result.workspaceId,
        repo: result.repo,
        bootstrap: result.bootstrap,
        handoff: result.handoff,
      }

      saveLaunchComplete(complete)

      if (result.bootstrap.warnings.length > 0) {
        setMessage("Setup retried. Some warnings remain — see the list above.")
      } else {
        setMessage("GitHub labels, milestones, and issues are set up.")
      }
    } catch {
      setMessage("Could not finish GitHub setup.")
      setProgressSteps(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className}>
      <Button
        className={mobileCtaClass}
        type="button"
        disabled={isSubmitting}
        onClick={handleRetry}
      >
        {isSubmitting ? "Retrying setup…" : "Retry GitHub setup"}
      </Button>

      {isSubmitting && progressSteps && progressSteps.length > 0 ? (
        <Panel interactive={false} className="mt-4 border-primary/30">
          <WorkspaceCreationProgress steps={progressSteps} />
        </Panel>
      ) : null}

      {message ? (
        <p className="mt-2 text-base text-muted-foreground">{message}</p>
      ) : null}
    </div>
  )
}
