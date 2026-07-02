function optional(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

export function getCursorApiBaseUrl(): string {
  return optional("CURSOR_API_BASE_URL") ?? "https://api.cursor.com"
}
