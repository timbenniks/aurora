"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { WorkspaceCreationProgress } from "@/components/launch/workspace-creation-progress"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { Panel } from "@/components/panel"
import { mobileCtaClass } from "@/lib/aurora/layout"
import { loadLaunchBrief, loadLaunchBriefDraft } from "@/lib/launch/brief-storage"
import {
  saveLaunchComplete,
} from "@/lib/launch/complete-storage"
import {
  runWorkspaceCreation,
  type CreationProgressStep,
} from "@/lib/launch/run-workspace-creation"
import { cn } from "@/lib/utils"

type CreateRepositoryButtonProps = {
  className?: string
}

export function CreateRepositoryButton({
  className,
}: CreateRepositoryButtonProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progressSteps, setProgressSteps] = useState<CreationProgressStep[] | null>(
    null
  )

  const signedIn = status === "authenticated" && Boolean(session?.user)
  const hasInstallation = Boolean(session?.githubInstallationId)
  const canAttemptCreate = signedIn && hasInstallation

  async function handleCreate() {
    setIsSubmitting(true)
    setMessage(null)
    setProgressSteps([])

    const briefJson = loadLaunchBrief() ?? loadLaunchBriefDraft()

    if (!briefJson?.trim()) {
      setMessage("No validated launch brief found. Go back to the Launch room.")
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
        (steps) => setProgressSteps(steps)
      )

      if (!result.ok) {
        if (result.code === "missing_installation") {
          setMessage("Install the Aurora GitHub App in Settings.")
        } else if (result.code === "duplicate_repo_name") {
          setMessage(
            result.error ??
              "A repository with this name already exists on your GitHub account."
          )
        } else if (result.repoUrl) {
          setMessage(`${result.error} Check GitHub: ${result.repoUrl}`)
        } else {
          setMessage(result.error)
        }
        return
      }

      saveLaunchComplete({
        workspaceId: result.workspaceId,
        repo: result.repo,
        bootstrap: result.bootstrap,
        handoff: result.handoff,
      })

      router.push("/launch/complete")
    } catch {
      setMessage("Could not create repository.")
      setProgressSteps(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!signedIn) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <ButtonLink className={mobileCtaClass} href="/settings">
          Sign in to create repository
        </ButtonLink>
      </div>
    )
  }

  if (!hasInstallation) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <ButtonLink className={mobileCtaClass} href="/settings">
          Install GitHub App
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Button
        className={mobileCtaClass}
        type="button"
        disabled={!canAttemptCreate || isSubmitting}
        onClick={handleCreate}
      >
        {isSubmitting ? "Working on GitHub…" : "Create repository"}
      </Button>

      {isSubmitting && progressSteps && progressSteps.length > 0 ? (
        <Panel interactive={false} className="border-primary/30">
          <h2 className="text-sm text-muted-foreground">
            Setting up your GitHub repository
          </h2>
          <p className="mt-1 text-base text-muted-foreground">
            This usually takes 20–40 seconds. Aurora talks to GitHub between each
            step.
          </p>
          <WorkspaceCreationProgress className="mt-4" steps={progressSteps} />
        </Panel>
      ) : null}

      {message ? (
        <p className="text-base text-muted-foreground">{message}</p>
      ) : null}
    </div>
  )
}
