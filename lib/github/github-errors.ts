import { GitHubApiError } from "@/lib/github/client"

type GitHubFieldError = {
  code?: string
  message?: string
  field?: string
  resource?: string
}

export function isDuplicateGitHubResource(error: GitHubApiError): boolean {
  const details = error.details as { errors?: GitHubFieldError[] } | undefined
  const fieldErrors = details?.errors ?? []

  if (
    fieldErrors.some(
      (entry) =>
        entry.code === "already_exists" ||
        entry.message?.toLowerCase().includes("already exists")
    )
  ) {
    return true
  }

  return error.message.toLowerCase().includes("already exists")
}

export function formatGitHubError(error: GitHubApiError): string {
  const details = error.details as { errors?: GitHubFieldError[] } | undefined
  const fieldErrors = details?.errors ?? []

  if (fieldErrors.length === 0) {
    return error.message
  }

  const parts = fieldErrors.map((entry) => {
    const bits = [entry.field, entry.code, entry.message].filter(Boolean)
    return bits.join(": ")
  })

  return `${error.message} (${parts.join("; ")})`
}
