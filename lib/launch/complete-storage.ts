const COMPLETE_STORAGE_KEY = "aurora:launch-complete"

export type LaunchCompleteIssue = {
  number: number
  title: string
  url: string
}

export type LaunchCompleteData = {
  workspaceId?: string
  repo: {
    fullName: string
    url: string
    defaultBranch: string
  }
  bootstrap: {
    filesCommitted: number
    filePaths: string[]
    labelsCreated: number
    milestonesCreated: number
    issues: LaunchCompleteIssue[]
    warnings: string[]
  }
  handoff: {
    agentCommand: string
    firstIssue?: LaunchCompleteIssue
  }
}

const listeners = new Set<() => void>()
let cachedRaw: string | null | undefined
let cachedSnapshot: LaunchCompleteData | null | undefined

function notifyLaunchCompleteListeners() {
  listeners.forEach((listener) => listener())
}

function parseLaunchComplete(raw: string | null): LaunchCompleteData | null {
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as LaunchCompleteData
  } catch {
    return null
  }
}

export function subscribeToLaunchComplete(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Stable snapshot for useSyncExternalStore — caches by sessionStorage value. */
export function getLaunchCompleteSnapshot(): LaunchCompleteData | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = sessionStorage.getItem(COMPLETE_STORAGE_KEY)

  if (raw === cachedRaw) {
    return cachedSnapshot ?? null
  }

  cachedRaw = raw
  cachedSnapshot = parseLaunchComplete(raw)
  return cachedSnapshot
}

export function saveLaunchComplete(data: LaunchCompleteData) {
  if (typeof window === "undefined") {
    return
  }

  const raw = JSON.stringify(data)
  sessionStorage.setItem(COMPLETE_STORAGE_KEY, raw)
  cachedRaw = raw
  cachedSnapshot = data
  notifyLaunchCompleteListeners()
}

export function loadLaunchComplete(): LaunchCompleteData | null {
  return getLaunchCompleteSnapshot()
}

export function clearLaunchComplete() {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.removeItem(COMPLETE_STORAGE_KEY)
  cachedRaw = null
  cachedSnapshot = null
  notifyLaunchCompleteListeners()
}
