import { GitHubApiError } from "@/lib/github/client"

export type RepoTokenPair = {
  primary: string
  fallback?: string
}

function shouldRetryWithFallback(error: unknown): boolean {
  if (!(error instanceof GitHubApiError)) {
    return false
  }

  return error.status === 401 || error.status === 403 || error.status === 404
}

export async function withRepoToken<T>(
  tokens: RepoTokenPair | string,
  operation: (token: string) => Promise<T>
): Promise<T> {
  const tokenList =
    typeof tokens === "string"
      ? [tokens]
      : [tokens.primary, tokens.fallback].filter(
          (token): token is string => Boolean(token)
        )

  let lastError: unknown

  for (const token of tokenList) {
    try {
      return await operation(token)
    } catch (error) {
      lastError = error

      if (!shouldRetryWithFallback(error)) {
        throw error
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new GitHubApiError("GitHub request failed.", 500)
}
