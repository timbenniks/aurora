import { exampleLaunchBrief } from "@/lib/aurora/example-launch-brief"
import {
  AGENT_PROVIDER,
  PROJECT_TYPES,
  PROJECT_VISIBILITY,
  REPO_NAME_RULES,
  TASK_PRIORITIES,
  TASK_RISKS,
  TASK_TYPES,
  WORKFLOW_PRESETS,
} from "@/lib/aurora/launch-brief-enums"
import {
  DEFAULT_GENERATE_FILES,
  LAUNCH_BRIEF_SCHEMA_VERSION,
} from "@/lib/aurora/types"

function list(values: readonly string[]): string {
  return values.map((value) => `  - ${value}`).join("\n")
}

const SCHEMA_REFERENCE = `## Schema: ${LAUNCH_BRIEF_SCHEMA_VERSION}

Return one JSON object with exactly these top-level keys:
schema_version, project, product, technical, workflow, files, milestones, tasks

### schema_version
- Must be exactly: "${LAUNCH_BRIEF_SCHEMA_VERSION}"

### project (all required)
- name: string — display name
- repo_name: string — GitHub repo slug. ${REPO_NAME_RULES}
- description: string
- visibility: one of:
${list(PROJECT_VISIBILITY)}
- project_type: one of:
${list(PROJECT_TYPES)}

### product (all required)
- problem: string
- target_users: string[] — at least one entry
- mvp_goal: string
- mvp_scope: string[] — at least one entry
- non_goals: string[] — list explicit out-of-scope items (use [] only if truly none)

### technical (all required)
- stack: object with all keys required:
  - framework (e.g. nextjs)
  - language (e.g. typescript)
  - package_manager (e.g. npm, pnpm, yarn)
  - styling (e.g. tailwind_v4)
  - ui (e.g. shadcn_ui)
  - database (e.g. postgres, none)
  - orm (e.g. drizzle, prisma, none)
  - auth (e.g. authjs, clerk, none)
  - deployment (e.g. vercel)
- validation_commands: string[] — at least one; include typecheck, lint, and build using the chosen package_manager
- risk_areas: string[] — e.g. authentication, database_mutations

### workflow (all required unless noted)
- preset: one of:
${list(WORKFLOW_PRESETS)}
- default_branch: string (default: main)
- agent_provider: must be "${AGENT_PROVIDER}"
- agent_command: string (default: /agent build)
- approval_policy: string (default: safe_default)
- max_files_without_human_review: positive integer (optional)

### files (required)
- generate: string[] — safe relative paths only (letters, numbers, /, ., _, -)
- Default file list unless we agreed otherwise:
${list(DEFAULT_GENERATE_FILES)}

### milestones (array, at least one recommended)
Each milestone:
- id: string (e.g. milestone-001)
- title: string
- description: string

### tasks (array, at least one required)
Each task — required fields:
- id: string (e.g. task-001)
- title: string
- type: one of:
${list(TASK_TYPES)}
- priority: one of:
${list(TASK_PRIORITIES)}
- risk: one of:
${list(TASK_RISKS)}
- goal: string
- acceptance_criteria: string[] — at least one
- validation: string[] — at least one command (match package_manager)
- agent_kickoff: object with:
  - command: string (usually /agent build)
  - prompt: string — focused PR instructions for the agent
  - expected_pr_size: string (optional, e.g. small)
  - human_review_required: boolean (optional; use true when risk is high)

Optional per task: milestone, context, likely_files, constraints, labels, review_routing

- review_routing: string[] of short reviewer tags only (e.g. ["frontend", "security", "cli"]) — NOT a prose explanation. For human review, use agent_kickoff.human_review_required: true and explain why in constraints or agent_kickoff.prompt.

Task rules:
- Keep tasks small and PR-sized (roughly ≤8 acceptance criteria, ≤10 likely files).
- First task should be a small setup/foundation task when possible.
- Every task needs acceptance_criteria, validation, and agent_kickoff.prompt.
- If risk is high, set agent_kickoff.human_review_required to true.`

const DEFAULTS = `Default choices unless we agreed otherwise:
- visibility: private
- project_type: web_app
- workflow.preset: safe_default
- workflow.default_branch: main
- workflow.agent_provider: ${AGENT_PROVIDER}
- workflow.agent_command: /agent build
- workflow.approval_policy: safe_default
- workflow.max_files_without_human_review: 10`

const EXAMPLE_JSON = JSON.stringify(exampleLaunchBrief, null, 2)

/** Paste first — collaborative planning, no JSON output. */
export const EXTERNAL_INTERVIEW_PROMPT = `You are my Aurora launch brief planner.

Aurora turns a structured JSON launch brief into a GitHub repo, setup files, and agent-ready GitHub issues for Cursor agents. I will paste the JSON into Aurora after we are done planning.

## Your mode right now: INTERVIEW ONLY

Do NOT output JSON, code blocks of JSON, schema templates, or a filled launch brief yet.
Do NOT invent a sample project, placeholder repo, or fictional app to demonstrate the format.
Do NOT dump the Aurora schema at me unless I explicitly ask for it.

Your job is to work with me on my real idea:
1. Understand what I want to build and for whom.
2. Help me make concrete product and technical decisions.
3. Keep the MVP ruthlessly small.
4. Shape milestones and small PR-sized tasks we can hand to Cursor agents later.

## How to run the conversation

- If I have not described an idea yet, your first reply should be 1–2 short questions asking what I want to build. Nothing else.
- Ask at most 3 focused questions per message.
- When I am vague, offer 2–3 concrete options with tradeoffs — do not silently pick for me.
- Propose defaults only when I say I am unsure (e.g. Next.js + TypeScript + Vercel).
- Push back on scope creep. Ask what we can cut for v1.
- After each round, end with a short plain-English summary of what we have decided so far (bullet points, not JSON).
- Do not invent credentials, account names, private URLs, or secrets.

## Topics to cover over the conversation (take your time)

1. Project — name, one-line description, public or private repo
2. Product — problem, target users, MVP goal, in-scope features, explicit non-goals
3. Technical — framework, language, package manager, styling, UI kit, database, ORM, auth, deployment
4. Workflow — branch name, how cautious agents should be
5. Work breakdown — milestones and small tasks with acceptance criteria in plain English

## When planning is done

Stop interviewing when I confirm we are ready (e.g. "generate launch brief", "output JSON", "I'm ready").

Then I will paste a second prompt that asks you to produce the final JSON from our conversation. Until then, stay in interview mode.`

/** Paste after the interview — produces valid JSON from the conversation. */
export const EXTERNAL_GENERATE_PROMPT = `We have been planning my Aurora launch brief in this conversation.

Using ONLY what we agreed in our discussion above, produce the final launch brief JSON.

Rules:
- Do not re-interview me. Do not ask more questions unless a required field was never discussed.
- If something minor is missing, infer it from our conversation and the defaults below.
- Use only the enum values listed in the schema.
- repo_name must be a valid GitHub slug (lowercase, no spaces).
- Match validation command prefixes to package_manager (npm run …, pnpm …, yarn …).
- Output ONLY raw JSON — no markdown fences, no commentary before or after.

${DEFAULTS}

${SCHEMA_REFERENCE}

## Shape reference (structure only — use our project details, not this example's)

${EXAMPLE_JSON}`

/** @deprecated Use EXTERNAL_INTERVIEW_PROMPT + EXTERNAL_GENERATE_PROMPT */
export const EXTERNAL_LAUNCH_PROMPT = EXTERNAL_INTERVIEW_PROMPT
