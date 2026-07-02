import type { LaunchCompleteData } from "@/lib/launch/complete-storage"
import type { WorkspaceCreateStep } from "@/lib/workspaces/workspace-create-steps"

export type CreationProgressStatus =
  | "pending"
  | "running"
  | "done"
  | "error"
  | "skipped"

export type CreationProgressStep = {
  id: WorkspaceCreateStep | "validate"
  label: string
  detail?: string
  status: CreationProgressStatus
  error?: string
}

type StepApiResponse = {
  error?: string
  code?: string
  repo?: LaunchCompleteData["repo"] & {
    id?: number
    owner?: string
    name?: string
    fullName?: string
  }
  summary?: {
    repoName: string
    fileCount: number
    milestoneCount: number
    taskCount: number
  }
  milestoneMap?: Record<string, number>
  partial?: LaunchCompleteData["bootstrap"]
  handoff?: LaunchCompleteData["handoff"]
  bootstrap?: LaunchCompleteData["bootstrap"]
  workspaceId?: string
}

export type WorkspaceCreationResult =
  | {
      ok: true
      workspaceId?: string
      repo: LaunchCompleteData["repo"]
      bootstrap: LaunchCompleteData["bootstrap"]
      handoff: LaunchCompleteData["handoff"]
    }
  | {
      ok: false
      error: string
      code?: string
      repoUrl?: string
    }

function buildSteps(
  summary: StepApiResponse["summary"],
  options?: { bootstrapOnly?: boolean }
): CreationProgressStep[] {
  const fileCount = summary?.fileCount ?? 0
  const milestoneCount = summary?.milestoneCount ?? 0
  const taskCount = summary?.taskCount ?? 0
  const repoName = summary?.repoName ?? "repository"

  const steps: CreationProgressStep[] = [
    {
      id: "validate",
      label: "Validate launch brief",
      status: "pending",
    },
    {
      id: "repo",
      label: `Create GitHub repository`,
      detail: repoName,
      status: "pending",
    },
  ]

  if (!options?.bootstrapOnly) {
    steps.push({
      id: "files",
      label: `Commit setup files`,
      detail: `${fileCount} files`,
      status: "pending",
    })
  }

  steps.push(
    {
      id: "labels",
      label: "Create GitHub labels",
      status: "pending",
    },
    {
      id: "milestones",
      label: "Create milestones",
      detail:
        milestoneCount > 0 ? `${milestoneCount} milestones` : "No milestones",
      status: "pending",
    },
    {
      id: "issues",
      label: "Create agent issues",
      detail: `${taskCount} issues`,
      status: "pending",
    }
  )

  return steps
}

function setStep(
  steps: CreationProgressStep[],
  id: CreationProgressStep["id"],
  patch: Partial<CreationProgressStep>
): CreationProgressStep[] {
  return steps.map((step) => (step.id === id ? { ...step, ...patch } : step))
}

async function postStep(
  launchBrief: unknown,
  step: WorkspaceCreateStep,
  payload: Record<string, unknown>
): Promise<{ response: Response; data: StepApiResponse }> {
  const response = await fetch("/api/workspaces/create-from-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      launch_brief: launchBrief,
      step,
      ...payload,
    }),
  })

  const data = (await response.json()) as StepApiResponse
  return { response, data }
}

function mergeBootstrap(
  base: LaunchCompleteData["bootstrap"],
  patch?: Partial<LaunchCompleteData["bootstrap"]>
): LaunchCompleteData["bootstrap"] {
  if (!patch) {
    return base
  }

  return {
    filesCommitted: patch.filesCommitted ?? base.filesCommitted,
    filePaths: patch.filePaths ?? base.filePaths,
    labelsCreated: patch.labelsCreated ?? base.labelsCreated,
    milestonesCreated: patch.milestonesCreated ?? base.milestonesCreated,
    issues: patch.issues ?? base.issues,
    warnings: [...base.warnings, ...(patch.warnings ?? [])],
  }
}

export async function runWorkspaceCreation(
  launchBrief: unknown,
  onProgress: (steps: CreationProgressStep[]) => void,
  options?: { bootstrapOnly?: boolean }
): Promise<WorkspaceCreationResult> {
  let steps = buildSteps(undefined, options)
  onProgress(steps)

  steps = setStep(steps, "validate", {
    status: "running",
    detail: "Checking JSON schema",
  })
  onProgress(steps)

  let repo: StepApiResponse["repo"]
  let milestoneMap: Record<string, number> | undefined
  let bootstrap: LaunchCompleteData["bootstrap"] = {
    filesCommitted: 0,
    filePaths: [],
    labelsCreated: 0,
    milestonesCreated: 0,
    issues: [],
    warnings: [],
  }
  let handoff: LaunchCompleteData["handoff"] | undefined
  let workspaceId: string | undefined

  steps = setStep(steps, "validate", { status: "done" })
  onProgress(steps)

  const stepOrder: WorkspaceCreateStep[] = options?.bootstrapOnly
    ? ["repo", "labels", "milestones", "issues"]
    : ["repo", "files", "labels", "milestones", "issues"]

  for (const stepId of stepOrder) {
    steps = setStep(steps, stepId, { status: "running" })
    onProgress(steps)

    const { response, data } = await postStep(launchBrief, stepId, {
      repo,
      milestone_map: milestoneMap,
      bootstrap_only: options?.bootstrapOnly === true,
    })

    if (data.summary && stepId === "repo") {
      steps = buildSteps(data.summary, options).map((entry) => {
        if (entry.id === "validate") {
          return { ...entry, status: "done" as const }
        }

        if (entry.id === stepId) {
          return { ...entry, status: "running" as const }
        }

        return entry
      })
      onProgress(steps)
    }

    if (!response.ok) {
      steps = setStep(steps, stepId, {
        status: "error",
        error: data.error ?? "Step failed.",
      })
      onProgress(steps)

      return {
        ok: false,
        error: data.error ?? "Could not create repository.",
        code: data.code,
        repoUrl: data.repo?.url,
      }
    }

    if (data.repo) {
      repo = data.repo
    }

    if (data.milestoneMap) {
      milestoneMap = data.milestoneMap
    }

    if (data.partial) {
      bootstrap = mergeBootstrap(bootstrap, data.partial)
    }

    if (data.handoff) {
      handoff = data.handoff
    }

    if (data.workspaceId) {
      workspaceId = data.workspaceId
    }

    steps = setStep(steps, stepId, { status: "done" })
    onProgress(steps)
  }

  if (!repo?.url) {
    return { ok: false, error: "Repository response was incomplete." }
  }

  return {
    ok: true,
    workspaceId,
    repo: {
      fullName:
        repo.fullName ?? `${repo.owner ?? "unknown"}/${repo.name ?? "repo"}`,
      url: repo.url,
      defaultBranch: repo.defaultBranch ?? "main",
    },
    bootstrap,
    handoff: handoff ?? {
      agentCommand: "/agent build",
    },
  }
}
