const DRAFT_STORAGE_KEY = "aurora:launch-brief-draft"
const VALIDATED_STORAGE_KEY = "aurora:launch-brief-validated"

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export function subscribeToLaunchBrief(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Persist the textarea draft across navigation and browser restarts. */
export function saveLaunchBriefDraft(json: string) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(DRAFT_STORAGE_KEY, json)
  notifyListeners()
}

export function loadLaunchBriefDraft(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem(DRAFT_STORAGE_KEY)
}

export function getLaunchBriefDraftSnapshot(): string {
  return loadLaunchBriefDraft() ?? ""
}

/**
 * Record that this exact draft passed validation. Validity is derived by
 * comparing the marker against the current draft, so editing the draft
 * automatically invalidates it — preview and creation always operate on the
 * same string the user validated.
 */
export function markLaunchBriefValidated(json: string) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(VALIDATED_STORAGE_KEY, json)
  notifyListeners()
}

export function isLaunchBriefValidated(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  const draft = localStorage.getItem(DRAFT_STORAGE_KEY)

  if (!draft?.trim()) {
    return false
  }

  return localStorage.getItem(VALIDATED_STORAGE_KEY) === draft
}

export function clearLaunchBrief() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(DRAFT_STORAGE_KEY)
  localStorage.removeItem(VALIDATED_STORAGE_KEY)
  notifyListeners()
}
