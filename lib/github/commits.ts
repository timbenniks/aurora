import type { GeneratedFile } from "@/lib/aurora/types"
import { GitHubApiError, githubApiRequest } from "@/lib/github/client"

type ContentCommitResponse = {
  commit: { sha: string }
}

type ExistingContent = {
  sha: string
}

function encodeContentPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/")
}

function toBase64(content: string): string {
  return Buffer.from(content, "utf8").toString("base64")
}

function wrapCommitError(
  error: unknown,
  owner: string,
  repo: string,
  branch: string,
  filePath: string
): Error {
  if (error instanceof GitHubApiError) {
    return new GitHubApiError(
      `${error.message} (${owner}/${repo}@${branch}:${filePath})`,
      error.status,
      { code: error.code, details: error.details }
    )
  }

  return error instanceof Error ? error : new Error("Could not commit file.")
}

async function putFile(
  owner: string,
  repo: string,
  branch: string,
  file: GeneratedFile,
  message: string,
  token: string
): Promise<string> {
  const path = encodeContentPath(file.path)

  const commit = async (sha?: string) => {
    const body: Record<string, unknown> = {
      message,
      content: toBase64(file.content),
      branch,
    }

    if (sha) {
      body.sha = sha
    }

    const result = await githubApiRequest<ContentCommitResponse>(
      `/repos/${owner}/${repo}/contents/${path}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    )

    return result.commit.sha
  }

  try {
    return await commit()
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 422) {
      try {
        const existing = await githubApiRequest<ExistingContent>(
          `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
          token
        )

        if (existing.sha) {
          return await commit(existing.sha)
        }
      } catch {
        // Fall through to the original error.
      }
    }

    throw wrapCommitError(error, owner, repo, branch, file.path)
  }
}

/**
 * Commit files via the Contents API. Works on empty repositories (Git Data API
 * returns 409 until the repo has at least one commit).
 */
export async function commitFiles(
  owner: string,
  repo: string,
  branch: string,
  files: GeneratedFile[],
  message: string,
  tokens: string | { primary: string; fallback?: string }
): Promise<{ commitSha: string; fileCount: number }> {
  if (files.length === 0) {
    throw new GitHubApiError("No files to commit.", 400)
  }

  const tokenList =
    typeof tokens === "string"
      ? [tokens]
      : [tokens.primary, tokens.fallback].filter(
          (token): token is string => Boolean(token)
        )

  let lastError: unknown
  let lastCommitSha = ""

  for (const token of tokenList) {
    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        const commitMessage =
          index === 0 ? message : `${message} — add ${file.path}`

        lastCommitSha = await putFile(
          owner,
          repo,
          branch,
          file,
          commitMessage,
          token
        )
      }

      return { commitSha: lastCommitSha, fileCount: files.length }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new GitHubApiError("Could not commit files.", 500)
}
