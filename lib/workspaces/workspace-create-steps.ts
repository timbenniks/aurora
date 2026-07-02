import type { LaunchBrief } from "@/lib/aurora/types"
import { generateAllFiles } from "@/lib/aurora/generate-files"
import { getDefaultLabels } from "@/lib/aurora/labels"
import {
  parseLaunchBriefJson,
  validateLaunchBrief,
} from "@/lib/aurora/validate-launch-brief"
import type { RepositoryRef } from "@/lib/github/repos"

export type WorkspaceCreateStep =
  | "repo"
  | "files"
  | "labels"
  | "milestones"
  | "issues"

export type SerializedRepositoryRef = {
  id: number
  owner: string
  name: string
  fullName: string
  url: string
  defaultBranch: string
}

export function serializeRepositoryRef(repo: RepositoryRef): SerializedRepositoryRef {
  return {
    id: repo.id,
    owner: repo.owner,
    name: repo.name,
    fullName: repo.fullName,
    url: repo.url,
    defaultBranch: repo.defaultBranch,
  }
}

export function deserializeRepositoryRef(
  repo: SerializedRepositoryRef
): RepositoryRef {
  return { ...repo }
}

export type BriefCreationSummary = {
  projectName: string
  repoName: string
  fileCount: number
  labelCount: number
  milestoneCount: number
  taskCount: number
}

export function summarizeBrief(brief: LaunchBrief): BriefCreationSummary {
  return {
    projectName: brief.project.name,
    repoName: brief.project.repo_name,
    fileCount: generateAllFiles(brief).length,
    labelCount: getDefaultLabels().length,
    milestoneCount: brief.milestones.length,
    taskCount: brief.tasks.length,
  }
}

export function parseAndValidateBrief(launchBrief: unknown):
  | { ok: true; brief: LaunchBrief; summary: BriefCreationSummary }
  | {
      ok: false
      status: number
      code: string
      error: string
      errors?: ReturnType<typeof validateLaunchBrief>["errors"]
    } {
  const parsed = parseLaunchBriefJson(launchBrief)

  if (parsed.error) {
    return {
      ok: false,
      status: 400,
      code: "invalid_json",
      error: parsed.error.message,
      errors: [parsed.error],
    }
  }

  const validation = validateLaunchBrief(parsed.data)

  if (!validation.valid || !validation.normalized) {
    return {
      ok: false,
      status: 400,
      code: "invalid_brief",
      error: "Launch brief failed validation.",
      errors: validation.errors,
    }
  }

  const brief = validation.normalized

  return {
    ok: true,
    brief,
    summary: summarizeBrief(brief),
  }
}
