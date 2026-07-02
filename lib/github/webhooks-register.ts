import { getInstallationAccessToken } from "@/lib/github/app-auth"
import { GitHubApiError, githubApiRequest } from "@/lib/github/client"
import { getGitHubWebhookSecret } from "@/lib/github/env"
import { getWebhookCallbackUrl } from "@/lib/github/webhook-url"

const AURORA_WEBHOOK_EVENTS = [
  "issues",
  "issue_comment",
  "pull_request",
  "push",
  "check_run",
  "check_suite",
] as const

type RepositoryHook = {
  id: number
  config: { url?: string }
  active: boolean
}

type RepositoryHooksResponse = RepositoryHook[]

export async function ensureRepositoryWebhook(input: {
  owner: string
  repo: string
  installationId: number
}): Promise<{ created: boolean; hookId?: number }> {
  const callbackUrl = getWebhookCallbackUrl()
  const token = await getInstallationAccessToken(input.installationId)

  const hooks = await githubApiRequest<RepositoryHooksResponse>(
    `/repos/${input.owner}/${input.repo}/hooks`,
    token
  )

  const existing = hooks.find(
    (hook) => hook.active && hook.config.url === callbackUrl
  )

  if (existing) {
    return { created: false, hookId: existing.id }
  }

  const secret = getGitHubWebhookSecret()

  const hook = await githubApiRequest<RepositoryHook>(
    `/repos/${input.owner}/${input.repo}/hooks`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        name: "web",
        active: true,
        events: AURORA_WEBHOOK_EVENTS,
        config: {
          url: callbackUrl,
          content_type: "json",
          secret,
          insecure_ssl: "0",
        },
      }),
    }
  )

  return { created: true, hookId: hook.id }
}

export async function ensureRepositoryWebhookSafe(input: {
  owner: string
  repo: string
  installationId: number
}): Promise<void> {
  try {
    await ensureRepositoryWebhook(input)
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 403) {
      console.warn(
        `Webhook registration skipped for ${input.owner}/${input.repo}: insufficient permissions`
      )
      return
    }

    console.error(
      `Webhook registration failed for ${input.owner}/${input.repo}:`,
      error
    )
  }
}
