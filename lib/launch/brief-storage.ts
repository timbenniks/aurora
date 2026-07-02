const DRAFT_STORAGE_KEY = "aurora:launch-brief-draft"
const VALIDATED_STORAGE_KEY = "aurora:launch-brief"
const LEGACY_SESSION_KEY = "aurora:launch-brief"

const draftListeners = new Set<() => void>()

function notifyDraftListeners() {
  draftListeners.forEach((listener) => listener())
}

export function subscribeToLaunchBriefDraft(listener: () => void) {
  draftListeners.add(listener)
  return () => {
    draftListeners.delete(listener)
  }
}

export function getLaunchBriefDraftSnapshot(): string {
  return loadLaunchBriefDraft() ?? ""
}

function readDraftFromLegacySession(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY)
  if (!legacy) {
    return null
  }

  sessionStorage.removeItem(LEGACY_SESSION_KEY)
  localStorage.setItem(DRAFT_STORAGE_KEY, legacy)
  localStorage.setItem(VALIDATED_STORAGE_KEY, legacy)
  return legacy
}

/** Persist the textarea draft across navigation and browser restarts. */
export function saveLaunchBriefDraft(json: string) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(DRAFT_STORAGE_KEY, json)
  notifyDraftListeners()
}

export function loadLaunchBriefDraft(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const draft = localStorage.getItem(DRAFT_STORAGE_KEY)
  if (draft !== null) {
    return draft
  }

  return readDraftFromLegacySession()
}

/** Persist the last successfully validated brief for preview / repo steps. */
export function saveLaunchBrief(json: string) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(VALIDATED_STORAGE_KEY, json)
  saveLaunchBriefDraft(json)
}

export function loadLaunchBrief(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const validated = localStorage.getItem(VALIDATED_STORAGE_KEY)
  if (validated !== null) {
    return validated
  }

  return readDraftFromLegacySession()
}

/** Validated brief, falling back to draft — for prepare-existing and similar flows. */
export function getActiveLaunchBriefSnapshot(): string {
  return loadLaunchBrief() ?? loadLaunchBriefDraft() ?? ""
}

export function clearLaunchBrief() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(DRAFT_STORAGE_KEY)
  localStorage.removeItem(VALIDATED_STORAGE_KEY)
}
