import type {
  GeneratedFile,
  GeneratedIssue,
  LaunchBrief,
  ValidationMessage,
  ValidationSummary,
} from "@/lib/aurora/types"

export type LaunchPreviewData = {
  valid: true
  errors: []
  warnings: ValidationMessage[]
  summary: ValidationSummary
  files: GeneratedFile[]
  issues: GeneratedIssue[]
  labels: string[]
  milestones: LaunchBrief["milestones"]
}

export type LaunchPreviewError = {
  valid: false
  errors: ValidationMessage[]
  warnings: ValidationMessage[]
  summary?: ValidationSummary
}

export type LaunchPreviewResponse = LaunchPreviewData | LaunchPreviewError

export async function fetchLaunchPreview(
  json: unknown
): Promise<LaunchPreviewResponse> {
  const response = await fetch("/api/launch-brief/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json }),
  })

  if (!response.ok) {
    throw new Error("Preview request failed.")
  }

  return (await response.json()) as LaunchPreviewResponse
}
