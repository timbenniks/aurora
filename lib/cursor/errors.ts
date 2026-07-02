export class CursorApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(
    message: string,
    status: number,
    options?: { code?: string; details?: unknown }
  ) {
    super(message)
    this.name = "CursorApiError"
    this.status = status
    this.code = options?.code
    this.details = options?.details
  }
}

type CursorErrorBody = {
  error?: string
  message?: string
}

export function mapCursorErrorMessage(
  status: number,
  body?: CursorErrorBody
): string {
  const message = body?.error ?? body?.message

  if (message) {
    return message
  }

  if (status === 401) {
    return "Cursor API key is invalid or expired."
  }

  if (status === 403) {
    return "Cursor API key does not have permission for this action."
  }

  if (status === 409) {
    return "Cursor agent is busy with another run."
  }

  return `Cursor API request failed (${status})`
}
