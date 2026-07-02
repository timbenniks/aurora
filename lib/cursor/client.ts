import { getCursorApiBaseUrl } from "@/lib/cursor/env"
import { CursorApiError, mapCursorErrorMessage } from "@/lib/cursor/errors"

type CursorErrorBody = {
  error?: string
  message?: string
}

export async function cursorApiRequest<T>(
  path: string,
  apiKey: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${getCursorApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  })

  if (response.ok) {
    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  let body: CursorErrorBody | undefined

  try {
    body = (await response.json()) as CursorErrorBody
  } catch {
    body = undefined
  }

  throw new CursorApiError(
    mapCursorErrorMessage(response.status, body),
    response.status,
    { details: body }
  )
}
