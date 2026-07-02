function optional(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

export function getCursorApiBaseUrl(): string {
  return optional("CURSOR_API_BASE_URL") ?? "https://api.cursor.com"
}

export function getCursorApiKeyFromEnv(): string | undefined {
  return optional("CURSOR_API_KEY")
}

export function shouldAutoLaunchAgent(): boolean {
  if (!getCursorApiKeyFromEnv()) {
    return false
  }

  return optional("CURSOR_AUTO_LAUNCH_AGENT") !== "false"
}
