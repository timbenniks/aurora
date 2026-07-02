/**
 * Routes that never require a GitHub OAuth session.
 *
 * Used by NextAuth `authorized` and the middleware matcher. Machine-facing
 * endpoints (webhooks) authenticate with their own mechanism (HMAC, etc.).
 */

/** Prefixes skipped entirely by NextAuth middleware (no session cookie read). */
export const MIDDLEWARE_SKIP_PREFIXES = [
  "api/auth",
  "api/github/webhook",
] as const

/** UI routes reachable before sign-in. */
export const PUBLIC_PAGE_PATHS = ["/login"] as const

export function isPublicPath(pathname: string): boolean {
  if ((PUBLIC_PAGE_PATHS as readonly string[]).includes(pathname)) {
    return true
  }

  return MIDDLEWARE_SKIP_PREFIXES.some(
    (prefix) => pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`)
  )
}

export const middlewareMatcher = [
  `/((?!${[
    ...MIDDLEWARE_SKIP_PREFIXES,
    "_next/static",
    "_next/image",
    "favicon.ico",
    ".*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$",
  ].join("|")}).*)`,
] as const
