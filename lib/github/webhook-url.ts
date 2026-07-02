export function getWebhookCallbackUrl(): string {
  const explicit = process.env.AURORA_WEBHOOK_URL?.trim()

  if (explicit) {
    return explicit.replace(/\/$/, "")
  }

  const authUrl = process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim()

  if (authUrl) {
    return `${authUrl.replace(/\/$/, "")}/api/github/webhook`
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()

  if (vercelUrl) {
    return `https://${vercelUrl}/api/github/webhook`
  }

  throw new Error(
    "Webhook callback URL is not configured. Set AURORA_WEBHOOK_URL, AUTH_URL, or deploy on Vercel."
  )
}
