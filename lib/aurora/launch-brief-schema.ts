import { z } from "zod"

import {
  AGENT_PROVIDER,
  PROJECT_TYPES,
  PROJECT_VISIBILITY,
  REPO_NAME_PATTERN,
  TASK_PRIORITIES,
  TASK_RISKS,
  TASK_TYPES,
  WORKFLOW_PRESETS,
} from "@/lib/aurora/launch-brief-enums"
import { LAUNCH_BRIEF_SCHEMA_VERSION } from "@/lib/aurora/types"

const nonEmptyString = z.string().trim().min(1)

const repoNameSchema = z
  .string()
  .trim()
  .min(1, "Repository name is required")
  .max(100, "Repository name must be 100 characters or fewer")
  .regex(
    REPO_NAME_PATTERN,
    "Repository name must use lowercase letters, numbers, hyphens, underscores, or periods"
  )

const stackSchema = z.object({
  framework: nonEmptyString,
  language: nonEmptyString,
  package_manager: nonEmptyString,
  styling: nonEmptyString,
  ui: nonEmptyString,
  database: nonEmptyString,
  orm: nonEmptyString,
  auth: nonEmptyString,
  deployment: nonEmptyString,
})

const agentKickoffSchema = z.object({
  command: nonEmptyString,
  prompt: nonEmptyString,
  expected_pr_size: z.string().trim().min(1).optional(),
  human_review_required: z.boolean().optional(),
})

const taskSchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  milestone: nonEmptyString.optional(),
  type: z.enum(TASK_TYPES),
  priority: z.enum(TASK_PRIORITIES),
  risk: z.enum(TASK_RISKS),
  goal: nonEmptyString,
  context: nonEmptyString.optional(),
  acceptance_criteria: z
    .array(nonEmptyString)
    .min(1, "Each task needs at least one acceptance criterion"),
  likely_files: z.array(nonEmptyString).optional(),
  constraints: z.array(nonEmptyString).optional(),
  validation: z
    .array(nonEmptyString)
    .min(1, "Each task needs at least one validation command"),
  labels: z.array(nonEmptyString).optional(),
  review_routing: z.array(nonEmptyString).optional(),
  agent_kickoff: agentKickoffSchema,
})

export const launchBriefSchema = z.object({
  schema_version: z.literal(LAUNCH_BRIEF_SCHEMA_VERSION),
  project: z.object({
    name: nonEmptyString,
    repo_name: repoNameSchema,
    description: nonEmptyString,
    visibility: z.enum(PROJECT_VISIBILITY),
    project_type: z.enum(PROJECT_TYPES),
  }),
  product: z.object({
    problem: nonEmptyString,
    target_users: z.array(nonEmptyString).min(1),
    mvp_goal: nonEmptyString,
    mvp_scope: z.array(nonEmptyString).min(1),
    non_goals: z.array(z.string()),
  }),
  technical: z.object({
    stack: stackSchema,
    validation_commands: z
      .array(nonEmptyString)
      .min(1, "At least one validation command is required"),
    risk_areas: z.array(z.string()),
  }),
  workflow: z.object({
    preset: z.enum(WORKFLOW_PRESETS),
    default_branch: nonEmptyString,
    agent_provider: z.literal(AGENT_PROVIDER),
    agent_command: nonEmptyString,
    approval_policy: nonEmptyString,
    max_files_without_human_review: z.number().int().positive().optional(),
  }),
  files: z.object({
    generate: z.array(nonEmptyString),
  }),
  milestones: z.array(
    z.object({
      id: nonEmptyString,
      title: nonEmptyString,
      description: nonEmptyString,
    })
  ),
  tasks: z.array(taskSchema).min(1, "At least one task is required"),
})

export type LaunchBriefInput = z.infer<typeof launchBriefSchema>
