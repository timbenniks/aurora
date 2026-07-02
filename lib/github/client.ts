export const GITHUB_API_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
} as const

export class GitHubApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(
    message: string,
    status: number,
    options?: { code?: string; details?: unknown }
  ) {
    super(message)
    this.name = "GitHubApiError"
    this.status = status
    this.code = options?.code
    this.details = options?.details
  }
}

type GitHubErrorBody = {
  message?: string
  errors?: Array<{ message?: string; resource?: string; field?: string }>
  documentation_url?: string
}

export async function githubApiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      ...GITHUB_API_HEADERS,
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  })

  if (response.ok) {
    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  let body: GitHubErrorBody | undefined

  try {
    body = (await response.json()) as GitHubErrorBody
  } catch {
    body = undefined
  }

  const message = body?.message ?? `GitHub API request failed (${response.status})`
  const fieldMessages =
    body?.errors?.map((entry) => entry.message).filter(Boolean) ?? []
  const detailText =
    fieldMessages.length > 0 ? `${message}: ${fieldMessages.join(", ")}` : message

  throw new GitHubApiError(detailText, response.status, {
    details: body,
  })
}
