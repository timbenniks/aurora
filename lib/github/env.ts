import { readFileSync } from "node:fs"
import path from "node:path"

function required(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

function normalizePrivateKey(raw: string): string {
  let key = raw.trim()

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim()
  }

  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n")
  }

  if (!key.includes("-----BEGIN") || !key.includes("-----END")) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY must be a full PEM private key (BEGIN through END). " +
        "Use one line with \\n escapes, a quoted multiline value, or GITHUB_APP_PRIVATE_KEY_PATH."
    )
  }

  return key
}

function readPrivateKeyFromPath(keyPath: string): string {
  const absolute = path.isAbsolute(keyPath)
    ? keyPath
    : path.join(process.cwd(), keyPath)

  return normalizePrivateKey(readFileSync(absolute, "utf8"))
}

export function getAuthSecret(): string {
  return required("AUTH_SECRET")
}

export function getGitHubAppId(): string {
  return required("GITHUB_APP_ID")
}

export function getGitHubAppPrivateKey(): string {
  const keyPath = optional("GITHUB_APP_PRIVATE_KEY_PATH")

  if (keyPath) {
    return readPrivateKeyFromPath(keyPath)
  }

  return normalizePrivateKey(required("GITHUB_APP_PRIVATE_KEY"))
}

export function getGitHubAppSlug(): string {
  return required("GITHUB_APP_SLUG")
}

export function getGitHubAppClientId(): string | undefined {
  return optional("GITHUB_APP_CLIENT_ID")
}

export function getGitHubAppClientSecret(): string | undefined {
  return optional("GITHUB_APP_CLIENT_SECRET")
}

export function getGitHubWebhookSecret(): string {
  return required("GITHUB_WEBHOOK_SECRET")
}

export function isGitHubWebhookConfigured(): boolean {
  return Boolean(process.env.GITHUB_WEBHOOK_SECRET?.trim())
}

export function isGitHubAppConfigured(): boolean {
  const hasKey =
    Boolean(process.env.GITHUB_APP_PRIVATE_KEY?.trim()) ||
    Boolean(process.env.GITHUB_APP_PRIVATE_KEY_PATH?.trim())

  return Boolean(
    process.env.GITHUB_APP_ID?.trim() && hasKey && process.env.GITHUB_APP_SLUG?.trim()
  )
}
