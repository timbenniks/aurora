import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { NextResponse } from "next/server"

import { isAuthRequired } from "@/lib/auth/require-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/settings",
  },
  callbacks: {
    authorized({ auth, request }) {
      if (!isAuthRequired()) {
        return true
      }

      const { pathname } = request.nextUrl

      if (pathname.startsWith("/api/auth")) {
        return true
      }

      if (pathname.startsWith("/api/github/webhook")) {
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
