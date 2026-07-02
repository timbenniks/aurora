import type { ZodError } from "zod"

import { launchBriefSchema, type LaunchBriefInput } from "@/lib/aurora/launch-brief-schema"
import {
  DEFAULT_GENERATE_FILES,
  type LaunchBrief,
  type ValidationMessage,
  type ValidationResult,
  type ValidationSummary,
} from "@/lib/aurora/types"

const PROTECTED_ROUTE_PATTERN =
  /protected route|authentication|authorization|sign[- ]?in|login required/i

const PERSISTENCE_PATTERN =
  /persist|database|saved record|save to db|store in db|postgres|neon/i

const LARGE_TASK_CRITERIA_THRESHOLD = 8
const LARGE_TASK_FILES_THRESHOLD = 10

export function isSafeGeneratedFilePath(path: string): boolean {
  const trimmed = path.trim()

  if (!trimmed) {
    return false
  }

  if (
    trimmed.includes("..") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("\\") ||
    trimmed.includes("\0")
  ) {
    return false
  }

  if (/^[a-zA-Z]:/.test(trimmed)) {
    return false
  }

  return /^[a-zA-Z0-9._\-/]+$/.test(trimmed)
}

function formatZodPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return ""
  }

  return path
    .map((segment) => (typeof segment === "number" ? `[${segment}]` : segment))
    .join(".")
    .replace(/\.\[/g, "[")
}

function zodErrorToMessages(error: ZodError): ValidationMessage[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: formatZodPath(issue.path),
  }))
}

function collectUnsafeFilePathErrors(
  paths: string[],
  errors: ValidationMessage[]
) {
  paths.forEach((filePath, index) => {
    if (isSafeGeneratedFilePath(filePath)) {
      return
    }

    errors.push({
      code: "unsafe_file_path",
      message: `Generated file path is unsafe: ${filePath}`,
      path: `files.generate[${index}]`,
    })
  })
}

function taskText(task: LaunchBriefInput["tasks"][number]): string {
  return [
    task.title,
    task.goal,
    task.context ?? "",
    ...task.acceptance_criteria,
    ...(task.constraints ?? []),
    task.agent_kickoff.prompt,
  ].join(" ")
}

function collectWarnings(
  brief: LaunchBriefInput,
  warnings: ValidationMessage[]
) {
  const auth = brief.technical.stack.auth.toLowerCase()
  const database = brief.technical.stack.database.toLowerCase()
  const deployment = brief.technical.stack.deployment.toLowerCase()

  if (auth === "none") {
    brief.tasks.forEach((task, index) => {
      if (!PROTECTED_ROUTE_PATTERN.test(taskText(task))) {
        return
      }

      warnings.push({
        code: "auth_none_with_protected_routes",
        message:
          "Auth is set to none, but a task appears to involve authentication or protected routes.",
        path: `tasks[${index}]`,
      })
    })
  }

  if (database === "none") {
    brief.tasks.forEach((task, index) => {
      if (!PERSISTENCE_PATTERN.test(taskText(task))) {
        return
      }

      warnings.push({
        code: "database_none_with_persistence",
        message:
          "Database is set to none, but a task appears to require saved records or persistence.",
        path: `tasks[${index}]`,
      })
    })
  }

  if (brief.technical.risk_areas.length === 0) {
    warnings.push({
      code: "no_risk_areas",
      message: "No technical risk areas were declared.",
      path: "technical.risk_areas",
    })
  }

  if (!brief.workflow.default_branch.trim()) {
    warnings.push({
      code: "no_default_branch",
      message: "No default branch was specified.",
      path: "workflow.default_branch",
    })
  }

  brief.tasks.forEach((task, index) => {
    if (
      task.risk === "high" &&
      task.agent_kickoff.human_review_required !== true
    ) {
      warnings.push({
        code: "high_risk_without_human_review",
        message: "High-risk task does not require human review.",
        path: `tasks[${index}].agent_kickoff.human_review_required`,
      })
    }
  })

  const firstTask = brief.tasks[0]
  if (firstTask) {
    const criteriaCount = firstTask.acceptance_criteria.length
    const fileCount = firstTask.likely_files?.length ?? 0

    if (
      criteriaCount > LARGE_TASK_CRITERIA_THRESHOLD ||
      fileCount > LARGE_TASK_FILES_THRESHOLD
    ) {
      warnings.push({
        code: "large_first_task",
        message:
          "The first task looks large for a single agent PR. Consider splitting it.",
        path: "tasks[0]",
      })
    }
  }

  const validationCommands = brief.technical.validation_commands
    .join(" ")
    .toLowerCase()

  if (!validationCommands.includes("build")) {
    warnings.push({
      code: "missing_build_command",
      message: "Validation commands do not include a build step.",
      path: "technical.validation_commands",
    })
  }

  if (!validationCommands.includes("typecheck")) {
    warnings.push({
      code: "missing_typecheck_command",
      message: "Validation commands do not include a typecheck step.",
      path: "technical.validation_commands",
    })
  }

  if (!deployment || deployment === "none") {
    warnings.push({
      code: "missing_deployment_target",
      message: "No deployment target was specified.",
      path: "technical.stack.deployment",
    })
  }

  if (brief.product.non_goals.length === 0) {
    warnings.push({
      code: "no_non_goals",
      message: "No product non-goals were listed.",
      path: "product.non_goals",
    })
  }
}

function buildSummary(brief: LaunchBriefInput): ValidationSummary {
  const fileCount =
    brief.files.generate.length > 0
      ? brief.files.generate.length
      : DEFAULT_GENERATE_FILES.length

  return {
    projectName: brief.project.name,
    repoName: brief.project.repo_name,
    taskCount: brief.tasks.length,
    fileCount,
    visibility: brief.project.visibility,
    projectType: brief.project.project_type,
  }
}

export function validateLaunchBrief(input: unknown): ValidationResult {
  const parsed = launchBriefSchema.safeParse(input)

  if (!parsed.success) {
    return {
      valid: false,
      errors: zodErrorToMessages(parsed.error),
      warnings: [],
    }
  }

  const errors: ValidationMessage[] = []
  const warnings: ValidationMessage[] = []
  const brief = parsed.data

  collectUnsafeFilePathErrors(brief.files.generate, errors)
  collectWarnings(brief, warnings)

  const valid = errors.length === 0
  const summary = buildSummary(brief)

  return {
    valid,
    errors,
    warnings,
    summary,
    normalized: valid ? (brief as LaunchBrief) : undefined,
  }
}

export function parseLaunchBriefJson(raw: unknown): {
  data?: unknown
  error?: ValidationMessage
} {
  if (typeof raw === "string") {
    try {
      return { data: JSON.parse(raw) }
    } catch {
      return {
        error: {
          code: "invalid_json",
          message: "Launch brief is not valid JSON.",
          path: "",
        },
      }
    }
  }

  if (raw === null || typeof raw !== "object") {
    return {
      error: {
        code: "invalid_json",
        message: "Launch brief must be a JSON object.",
        path: "",
      },
    }
  }

  return { data: raw }
}
