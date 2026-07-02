import { auth } from "@/auth"
import type { SessionUserInput } from "@/lib/aurora/workspaces"

export type SessionUserError = {
  error: string
  code?: string
  status: 401 | 403
}

export async function requireSessionUser(): Promise<
  SessionUserInput | SessionUserError
> {
  const session = await auth()

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 }
  }

  if (!session.githubUserId || !session.githubLogin) {
    return {
      error: "GitHub account details missing from session. Sign out and sign in again.",
      code: "missing_github_user",
      status: 403,
    }
  }

  return {
    githubUserId: session.githubUserId,
    githubLogin: session.githubLogin,
    name: session.user.name,
    email: session.user.email,
    avatarUrl: session.user.image,
  }
}
