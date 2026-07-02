import { createAppAuth } from "@octokit/auth-app"

import {
  getGitHubAppClientId,
  getGitHubAppClientSecret,
  getGitHubAppId,
  getGitHubAppPrivateKey,
} from "@/lib/github/env"

export function createGitHubAppAuth() {
  return createAppAuth({
    appId: getGitHubAppId(),
    privateKey: getGitHubAppPrivateKey(),
    clientId: getGitHubAppClientId(),
    clientSecret: getGitHubAppClientSecret(),
  })
}

export async function getGitHubAppJwt(): Promise<string> {
  const auth = createGitHubAppAuth()
  const result = await auth({ type: "app" })
  return result.token
}

export async function getInstallationAccessToken(
  installationId: number
): Promise<string> {
  const auth = createGitHubAppAuth()
  const result = await auth({
    type: "installation",
    installationId,
  })
  return result.token
}
