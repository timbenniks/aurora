import type { LaunchBrief } from "@/lib/aurora/types"
import { generateAllFiles } from "@/lib/aurora/generate-files"
import type { BootstrapResult } from "@/lib/workspaces/bootstrap-repository"

export function bootstrapSnapshotFromBrief(
  brief: LaunchBrief,
  partial: Partial<BootstrapResult>,
  options?: { bootstrapOnly?: boolean }
): BootstrapResult {
  const generatedFiles = generateAllFiles(brief)
  const filePaths =
    partial.filePaths && partial.filePaths.length > 0
      ? partial.filePaths
      : generatedFiles.map((file) => file.path)

  const filesCommitted =
    partial.filesCommitted ??
    (options?.bootstrapOnly ? generatedFiles.length : filePaths.length)

  return {
    filesCommitted,
    filePaths,
    labelsCreated: partial.labelsCreated ?? 0,
    labelsSkipped: partial.labelsSkipped ?? 0,
    milestonesCreated: partial.milestonesCreated ?? 0,
    issues: partial.issues ?? [],
    warnings: partial.warnings ?? [],
  }
}
