/** Shared enum values for launch brief validation and external LLM prompts. */

export const PROJECT_VISIBILITY = ["private", "public", "internal"] as const

export const PROJECT_TYPES = [
  "web_app",
  "api_service",
  "cli",
  "package",
  "docs_site",
  "electron_app",
  "mobile_app",
] as const

export const WORKFLOW_PRESETS = [
  "solo_fast",
  "safe_default",
  "team_review",
  "strict_production",
] as const

export const TASK_TYPES = [
  "setup",
  "implementation",
  "refactor",
  "docs",
  "validation",
  "research",
] as const

export const TASK_PRIORITIES = ["low", "medium", "high"] as const

export const TASK_RISKS = ["low", "medium", "high"] as const

export const AGENT_PROVIDER = "cursor" as const

export const REPO_NAME_PATTERN =
  /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/

export const REPO_NAME_RULES =
  "Lowercase letters, numbers, hyphens, underscores, or periods only. Max 100 characters. Must start and end with a letter or number."
