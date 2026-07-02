import {
  mergeBootstrapPartial,
  type WorkspaceCreateStep,
} from "@/lib/workspaces/workspace-create-steps"

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

export type CreationIssue = {
  number: number
  title: string
  url: string
}

export type CreationRepo = {
  fullName: string
  url: string
  defaultBranch: string
}

export type CreationBootstrap = {
  filesCommitted: number
  filePaths: string[]
  labelsCreated: number
  milestonesCreated: number
  issues: CreationIssue[]
  warnings: string[]
}

export type CreationHandoff = {
  agentCommand: string
  firstIssue?: CreationIssue
}

type StepApiResponse = {
  error?: string
  code?: string
  repo?: CreationRepo & {
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
  partial?: Partial<CreationBootstrap>
  handoff?: CreationHandoff
  workspaceId?: string
}

export type WorkspaceCreationResult =
  | {
      ok: true
      workspaceId?: string
      repo: CreationRepo
      bootstrap: CreationBootstrap
      handoff: CreationHandoff
    }
  | {
      ok: false
      error: string
      code?: string
      repoUrl?: string
    }

/**
 * A partially completed creation run, persisted so a refresh or transient
 * failure can resume after the steps that already succeeded on GitHub
 * instead of stranding a half-bootstrapped repository.
 */
type CreationRunRecord = {
  briefJson: string
  bootstrapOnly: boolean
  repo?: StepApiResponse["repo"]
  summary?: StepApiResponse["summary"]
  milestoneMap?: Record<string, number>
  completed: WorkspaceCreateStep[]
  bootstrap: CreationBootstrap
}

const RUN_STORAGE_KEY = "aurora:creation-run"

function emptyBootstrap(): CreationBootstrap {
  return {
    filesCommitted: 0,
    filePaths: [],
    labelsCreated: 0,
    milestonesCreated: 0,
    issues: [],
    warnings: [],
  }
}

function loadRunRecord(
  briefJson: string,
  bootstrapOnly: boolean
): CreationRunRecord | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = sessionStorage.getItem(RUN_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const record = JSON.parse(raw) as CreationRunRecord

    if (
      record.briefJson === briefJson &&
      record.bootstrapOnly === bootstrapOnly
    ) {
      return record
    }
  } catch {
    // Corrupt record — start fresh.
  }

  sessionStorage.removeItem(RUN_STORAGE_KEY)
  return null
}

function saveRunRecord(record: CreationRunRecord) {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(record))
}

export function clearCreationRun() {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.removeItem(RUN_STORAGE_KEY)
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
      label: "Create GitHub repository",
      detail: repoName,
      status: "pending",
    },
  ]

  if (!options?.bootstrapOnly) {
    steps.push({
      id: "files",
      label: "Commit setup files",
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

export async function runWorkspaceCreation(
  briefJson: string,
  onProgress: (steps: CreationProgressStep[]) => void,
  options?: { bootstrapOnly?: boolean }
): Promise<WorkspaceCreationResult> {
  const bootstrapOnly = options?.bootstrapOnly === true

  let launchBrief: unknown

  try {
    launchBrief = JSON.parse(briefJson)
  } catch {
    return { ok: false, error: "Launch brief is not valid JSON." }
  }

  const resumed = loadRunRecord(briefJson, bootstrapOnly)
  const completed = new Set(resumed?.completed ?? [])
  let summary = resumed?.summary

  let steps = buildSteps(summary, options)
  onProgress(steps)

  steps = setStep(steps, "validate", {
    status: "running",
    detail: "Checking JSON schema",
  })
  onProgress(steps)

  let repo = resumed?.repo
  let milestoneMap = resumed?.milestoneMap
  let bootstrap: CreationBootstrap = resumed?.bootstrap ?? emptyBootstrap()
  let handoff: CreationHandoff | undefined
  let workspaceId: string | undefined

  steps = setStep(steps, "validate", { status: "done" })
  onProgress(steps)

  const stepOrder: WorkspaceCreateStep[] = bootstrapOnly
    ? ["repo", "labels", "milestones", "issues"]
    : ["repo", "files", "labels", "milestones", "issues"]

  for (const stepId of stepOrder) {
    if (completed.has(stepId)) {
      steps = setStep(steps, stepId, {
        status: "done",
        detail: "Already done — resumed",
      })
      onProgress(steps)
      continue
    }

    steps = setStep(steps, stepId, { status: "running" })
    onProgress(steps)

    const { response, data } = await postStep(launchBrief, stepId, {
      repo,
      milestone_map: milestoneMap,
      bootstrap_only: bootstrapOnly,
    })

    if (data.summary && stepId === "repo") {
      summary = data.summary
      steps = buildSteps(summary, options).map((entry) => {
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
        repoUrl: data.repo?.url ?? repo?.url,
      }
    }

    if (data.repo) {
      repo = data.repo
    }

    if (data.milestoneMap) {
      milestoneMap = data.milestoneMap
    }

    if (data.partial) {
      bootstrap = mergeBootstrapPartial(bootstrap, data.partial)
    }

    if (data.handoff) {
      handoff = data.handoff
    }

    if (data.workspaceId) {
      workspaceId = data.workspaceId
    }

    completed.add(stepId)
    saveRunRecord({
      briefJson,
      bootstrapOnly,
      repo,
      summary,
      milestoneMap,
      completed: [...completed],
      bootstrap,
    })

    steps = setStep(steps, stepId, { status: "done" })
    onProgress(steps)
  }

  clearCreationRun()

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
