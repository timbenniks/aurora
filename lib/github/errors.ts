import { GitHubApiError } from "@/lib/github/client"

export type MappedGitHubError = {
  message: string
  code: string
  status: number
}

type GitHubFieldError = {
  code?: string
  message?: string
  field?: string
  resource?: string
}

function fieldErrorsOf(error: GitHubApiError): GitHubFieldError[] {
  const details = error.details as { errors?: GitHubFieldError[] } | undefined
  return details?.errors ?? []
}

export function isDuplicateGitHubResource(error: GitHubApiError): boolean {
  const combined = [
    error.message,
    ...fieldErrorsOf(error).map((entry) => entry.message ?? ""),
  ]
    .join(" ")
    .toLowerCase()

  return (
    combined.includes("already exists") ||
    fieldErrorsOf(error).some((entry) => entry.code === "already_exists")
  )
}

export function formatGitHubError(error: GitHubApiError): string {
  const fieldErrors = fieldErrorsOf(error)

  if (fieldErrors.length === 0) {
    return error.message
  }

  const parts = fieldErrors.map((entry) => {
    const bits = [entry.field, entry.code, entry.message].filter(Boolean)
    return bits.join(": ")
  })

  return `${error.message} (${parts.join("; ")})`
}

function isRateLimited(error: GitHubApiError): boolean {
  const message = error.message.toLowerCase()
  return (
    error.status === 403 &&
    (message.includes("rate limit") || message.includes("abuse detection"))
  )
}

function isIntegrationBlocked(error: GitHubApiError): boolean {
  return error.message.toLowerCase().includes("resource not accessible by integration")
}

export function mapGitHubError(error: unknown): MappedGitHubError {
  if (!(error instanceof GitHubApiError)) {
    return {
      message: "Could not complete the GitHub request.",
      code: "github_error",
      status: 500,
    }
  }

  if (error.code === "missing_user_token") {
    return {
      message: error.message,
      code: "missing_user_token",
      status: 403,
    }
  }

  if (isIntegrationBlocked(error)) {
    return {
      message:
        "GitHub does not allow repository creation with the App installation token on personal accounts. Sign out and sign in again so Aurora can use your GitHub OAuth token.",
      code: "integration_not_allowed",
      status: 403,
    }
  }

  if (isDuplicateGitHubResource(error)) {
    return {
      message:
        "A repository with this name already exists on the GitHub account where Aurora is installed.",
      code: "duplicate_repo_name",
      status: 409,
    }
  }

  if (isRateLimited(error)) {
    return {
      message: "GitHub rate limit reached. Wait a few minutes and try again.",
      code: "rate_limited",
      status: 429,
    }
  }

  if (error.status === 401 || error.status === 403) {
    return {
      message:
        "Aurora does not have permission to create repositories. Check GitHub App permissions and reinstall if needed.",
      code: "insufficient_permissions",
      status: 403,
    }
  }

  if (error.status === 422) {
    return {
      message: error.message,
      code: "invalid_repo_request",
      status: 422,
    }
  }

  return {
    message: error.message,
    code: "github_error",
    status: error.status >= 400 && error.status < 600 ? error.status : 500,
  }
}
