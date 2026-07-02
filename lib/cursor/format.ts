import type { CursorRunStatus } from "@/lib/cursor/types"

export function formatCursorRunStatus(status: string | null | undefined): string {
  if (!status) {
    return "Not started"
  }

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function cursorRunStatusTone(
  status: string | null | undefined
): "success" | "warning" | "primary" | "destructive" | "muted" {
  if (!status) {
    return "muted"
  }

  switch (status as CursorRunStatus) {
    case "FINISHED":
      return "success"
    case "RUNNING":
    case "CREATING":
      return "primary"
    case "ERROR":
    case "CANCELLED":
    case "EXPIRED":
      return "destructive"
    default:
      return "warning"
  }
}

export function isCursorRunActive(status: string | null | undefined): boolean {
  return status === "CREATING" || status === "RUNNING"
}
