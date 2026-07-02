"use client"

import { useState } from "react"

import {
  runWorkspaceCreation,
  type CreationProgressStep,
  type WorkspaceCreationResult,
} from "@/lib/launch/run-workspace-creation"

function failureMessage(
  result: Extract<WorkspaceCreationResult, { ok: false }>
): string {
  if (result.code === "missing_installation") {
    return "Install the Aurora GitHub App in Settings."
  }

  if (result.code === "duplicate_repo_name") {
    return (
      result.error ??
      "A repository with this name already exists on your GitHub account."
    )
  }

  if (result.repoUrl) {
    return `${result.error} Check GitHub: ${result.repoUrl}`
  }

  return result.error
}

/**
 * Drives the step-wise workspace creation flow and exposes progress state.
 * Shared by the create step and the bootstrap retry so the load/parse/run
 * plumbing lives in one place.
 */
export function useWorkspaceCreation() {
  const [progressSteps, setProgressSteps] = useState<
    CreationProgressStep[] | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(
    briefJson: string,
    options?: { bootstrapOnly?: boolean }
  ): Promise<Extract<WorkspaceCreationResult, { ok: true }> | null> {
    setIsSubmitting(true)
    setError(null)
    setProgressSteps([])

    try {
      const result = await runWorkspaceCreation(
        briefJson,
        (steps) => setProgressSteps(steps),
        options
      )

      if (!result.ok) {
        setError(failureMessage(result))
        return null
      }

      return result
    } catch {
      setError("Could not create repository.")
      setProgressSteps(null)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { create, progressSteps, isSubmitting, error }
}
