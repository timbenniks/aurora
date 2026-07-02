import type { GitHubProfile } from "@auth/core/providers/github"
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { NextResponse } from "next/server"

import { isAuthRequired } from "@/lib/auth/require-auth"
import { isPublicPath } from "@/lib/auth/public-paths"

function mapGitHubProfile(profile: GitHubProfile) {
  if (profile.id == null) {
    const detail =
      typeof profile.message === "string"
        ? profile.message
        : "GitHub returned a profile without a user id"

    throw new TypeError(
      `${detail}. This usually means the OAuth access token was invalid — often because the callback was hit twice, AUTH_GITHUB_ID/SECRET are wrong, or the sign-in host does not match your GitHub App callback URL.`
    )
  }

  return {
    id: profile.id.toString(),
    name: profile.name ?? profile.login,
    email: profile.email,
    image: profile.avatar_url,
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
      profile: mapGitHubProfile,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      if (!isAuthRequired()) {
        return true
      }

      const { pathname } = request.nextUrl

      if (isPublicPath(pathname)) {
        return true
      }

      if (auth?.user) {
        return true
      }

      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      return false
    },
    jwt({ token, account, profile, trigger, session }) {
      if (account?.provider === "github") {
        if (account.access_token) {
          token.githubAccessToken = account.access_token
        }

        if (profile && "login" in profile) {
          token.githubLogin = profile.login as string
        }

        if (profile && "id" in profile && profile.id != null) {
          token.githubUserId = Number(profile.id)
        }
      }

      if (trigger === "update" && session?.githubInstallationId) {
        token.githubInstallationId = session.githubInstallationId
      }

      return token
    },
    session({ session, token }) {
      session.githubLogin = token.githubLogin
      session.githubUserId = token.githubUserId
      session.githubInstallationId = token.githubInstallationId
      return session
    },
  },
})
