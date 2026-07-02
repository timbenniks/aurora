import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    githubLogin?: string
    githubUserId?: number
    githubInstallationId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubLogin?: string
    githubUserId?: number
    githubInstallationId?: string
    githubAccessToken?: string
  }
}
