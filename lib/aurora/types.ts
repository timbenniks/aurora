export const LAUNCH_BRIEF_SCHEMA_VERSION = "aurora.launch_brief.v1" as const

export type ValidationMessage = {
  code: string
  message: string
  path: string
}

export type ValidationSummary = {
  projectName: string
  repoName: string
  taskCount: number
  fileCount: number
  visibility: string
  projectType: string
}

export type ValidationResult = {
  valid: boolean
  errors: ValidationMessage[]
  warnings: ValidationMessage[]
  summary?: ValidationSummary
  normalized?: LaunchBrief
}

export type LaunchBrief = {
  schema_version: typeof LAUNCH_BRIEF_SCHEMA_VERSION
  project: {
    name: string
    repo_name: string
    description: string
    visibility: "private" | "public" | "internal"
    project_type:
      | "web_app"
      | "api_service"
      | "cli"
      | "package"
      | "docs_site"
      | "electron_app"
      | "mobile_app"
  }
  product: {
    problem: string
    target_users: string[]
    mvp_goal: string
    mvp_scope: string[]
    non_goals: string[]
  }
  technical: {
    stack: {
      framework: string
      language: string
      package_manager: string
      styling: string
      ui: string
      database: string
      orm: string
      auth: string
      deployment: string
    }
    validation_commands: string[]
    risk_areas: string[]
  }
  workflow: {
    preset: "solo_fast" | "safe_default" | "team_review" | "strict_production"
    default_branch: string
    agent_provider: "cursor"
    agent_command: string
    approval_policy: string
    max_files_without_human_review?: number
  }
  files: {
    generate: string[]
  }
  milestones: Array<{
    id: string
    title: string
    description: string
  }>
  tasks: Array<{
    id: string
    title: string
    milestone?: string
    type:
      | "setup"
      | "implementation"
      | "refactor"
      | "docs"
      | "validation"
      | "research"
    priority: "low" | "medium" | "high"
    risk: "low" | "medium" | "high"
    goal: string
    context?: string
    acceptance_criteria: string[]
    likely_files?: string[]
    constraints?: string[]
    validation: string[]
    labels?: string[]
    review_routing?: string[]
    agent_kickoff: {
      command: string
      prompt: string
      expected_pr_size?: string
      human_review_required?: boolean
    }
  }>
}

export const DEFAULT_GENERATE_FILES = [
  "README.md",
  "SPEC.md",
  "AGENTS.md",
  "BUGBOT.md",
  "APPROVAL_POLICY.md",
  ".cursor/rules/project.mdc",
  ".cursor/approval-policies/ROUTING.md",
  ".github/ISSUE_TEMPLATE/agent-task.md",
  ".github/pull_request_template.md",
  ".github/workflows/agent-validation.yml",
  ".aurora/project.json",
] as const

export type GeneratedFile = {
  path: string
  content: string
}

export type GeneratedIssue = {
  taskId: string
  title: string
  body: string
  labels: string[]
  milestone?: string
}
