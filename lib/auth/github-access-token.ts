import { cookies } from "next/headers"
import { getToken } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"

import { getAuthSecret } from "@/lib/github/env"

function readAccessToken(payload: JWT | null): string | undefined {
  return typeof payload?.githubAccessToken === "string"
    ? payload.githubAccessToken
    : undefined
}

/** Server-only OAuth token for GitHub user-to-server API calls. */
export async function getGitHubAccessToken(
  request?: Request
): Promise<string | undefined> {
  const secret = getAuthSecret()
  const secureCookie = process.env.NODE_ENV === "production"

  if (request) {
    const fromRequest = await getToken({
      req: request,
      secret,
      secureCookie,
    })
    const token = readAccessToken(fromRequest as JWT | null)

    if (token) {
      return token
    }
  }

  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ")

  const fromCookies = await getToken({
    req: { headers: { cookie: cookieHeader } },
    secret,
    secureCookie,
  })

  return readAccessToken(fromCookies as JWT | null)
}
