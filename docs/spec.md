# Aurora app spec

## 1. Product summary

Aurora is an AI-free GitHub project launcher for agent-built software.

It turns a validated project launch brief into an agent-ready GitHub workspace. Aurora creates or prepares a repository, commits the required workflow files, creates initial GitHub issues, and gives the user a clean Cursor handoff.

Aurora does not run agents, review code, approve pull requests, or call an LLM. It creates the structure that lets GitHub, Cursor, Bugbot, Approval Agents, and humans work together safely.

## 2. Product one-liner

Aurora turns completed specs into GitHub repos that Cursor agents can build safely.

## 3. Core principle

Aurora is AI-compatible, not AI-powered.

The user can use any LLM externally to create a structured launch brief. Aurora only accepts the resulting JSON, validates it, and deterministically turns it into GitHub artifacts.

## 4. Product boundaries

Aurora owns:

- launch brief validation
- GitHub repo creation
- repo setup file generation
- initial issue creation
- selected workspace registry
- lightweight dashboard status
- Cursor setup handoff
- later workflow observation

Aurora does not own:

- product reasoning
- code execution
- AI model calls
- PR review
- approval decisions
- CI execution
- task source of truth
- PR source of truth

GitHub remains the durable source of truth for project state.

Aurora keeps only a lightweight rebuildable index for selected Aurora workspaces.

## 5. Primary MVP flow

### Flow: create new project from launch brief

1. User signs in with GitHub.
2. User opens Aurora.
3. User chooses “create new project.”
4. Aurora shows a copyable launch brief prompt/template.
5. User uses any external LLM to create the launch brief JSON.
6. User pastes the launch brief JSON into Aurora.
7. Aurora validates the JSON.
8. Aurora shows validation results.
9. Aurora previews generated files and issues.
10. User confirms.
11. Aurora creates a GitHub repository.
12. Aurora commits setup files to the repository.
13. Aurora creates GitHub labels.
14. Aurora creates GitHub milestones.
15. Aurora creates initial GitHub issues.
16. Aurora stores one workspace row in its DB.
17. Aurora shows a workspace dashboard.
18. Aurora shows Cursor setup instructions.

## 6. Secondary flow, later

### Flow: prepare existing repo

Not required for first build, but design should allow it later.

1. User selects an existing GitHub repository.
2. Aurora scans only that selected repo.
3. Aurora detects existing setup files.
4. Aurora generates missing workflow files.
5. Aurora opens a setup PR.
6. Aurora creates a workspace row.
7. Aurora tracks only that selected repo.

## 7. Authentication

Use GitHub sign-in.

Recommended:

- Next.js app
- Auth.js with GitHub provider
- JWT session strategy to avoid needing user session tables initially
- GitHub App for repository operations

Aurora should support two GitHub concepts:

1. GitHub OAuth user login
2. GitHub App installation for repo access

For MVP, keep it simple:

- User signs in with GitHub.
- User installs Aurora GitHub App.
- Aurora can create repos and write files/issues where authorized.

## 8. GitHub App permissions

Request minimal permissions.

Required for MVP:

- repository contents: read/write
- issues: read/write
- pull requests: read/write, optional for later setup PRs
- metadata: read
- actions/checks: read, later
- workflows: write, only if creating `.github/workflows/agent-validation.yml`

For MVP creation flow, Aurora needs to:

- create repository
- commit files
- create labels
- create milestones
- create issues

If repo creation through the GitHub App is awkward, use user OAuth for repo creation and GitHub App installation for ongoing repo management.

## 9. Data ownership model

GitHub stores:

- repository
- launch brief file
- product spec
- setup files
- issues
- labels
- milestones
- PRs
- comments
- checks
- reviews
- Cursor-generated branches and PRs

Aurora stores:

- selected workspaces
- GitHub installation mapping
- cached readiness status
- cached task summaries
- cached PR summaries later
- webhook delivery dedupe later

Aurora DB is not the source of truth. It is a rebuildable index.

## 10. Database model

Use Postgres.

Recommended stack:

- Neon Postgres
- Prisma or Drizzle
- Keep schema small

### Table: users

Stores signed-in users.

Fields:

```txt
id
github_user_id
github_login
name
email
avatar_url
created_at
updated_at
```

### Table: github_installations

Stores GitHub App installation references.

```txt
id
github_installation_id
account_login
account_type
created_at
updated_at
```

### Table: workspaces

A workspace is an Aurora-enabled repo.

```txt
id
user_id
github_installation_id
github_repo_id
owner
repo
full_name
default_branch
visibility
project_type
workflow_preset
created_from
enabled_at
last_scanned_at
last_synced_at
last_activity_at
created_at
updated_at
```

`created_from` enum:

```txt
launch_brief
existing_repo
imported
```

### Table: workspace_status

Cached status for fast dashboard loading.

```txt
id
workspace_id
readiness_score
has_agents_md
has_bugbot_md
has_approval_policy
has_cursor_rules
has_routing_policy
has_issue_template
has_pr_template
has_validation_workflow
open_agent_tasks
active_agent_tasks
open_agent_prs
blocked_prs
merged_agent_prs
last_error
created_at
updated_at
```

### Table: task_index

Cached summary of Aurora-created or Aurora-labeled GitHub issues.

```txt
id
workspace_id
github_issue_id
issue_number
title
state
status
risk
priority
milestone
labels_json
linked_pr_number
agent_command
agent_prompt
updated_at
created_at
```

### Table: pr_index, later

Not needed on day one, but leave room.

```txt
id
workspace_id
github_pr_id
pr_number
title
state
branch
author
source_issue_number
agent_provider
ci_status
bugbot_status
approval_status
human_review_required
merged_at
updated_at
created_at
```

### Table: webhook_deliveries, later

```txt
id
github_delivery_id
event_name
workspace_id
processed_at
payload_hash
created_at
```

## 11. Launch brief JSON

Aurora consumes a strict JSON object.

The user gets this JSON from an external LLM, a ChatGPT Skill, or a copyable prompt template.

Aurora validates the JSON before doing anything.

### Required top-level schema

```json
{
  "schema_version": "aurora.launch_brief.v1",
  "project": {},
  "product": {},
  "technical": {},
  "workflow": {},
  "files": {},
  "milestones": [],
  "tasks": []
}
```

## 12. Launch brief schema

### `project`

```json
{
  "name": "TinyInvoices",
  "repo_name": "tinyinvoices",
  "description": "A simple invoice app for freelancers.",
  "visibility": "private",
  "project_type": "web_app"
}
```

Required:

- `name`
- `repo_name`
- `description`
- `visibility`
- `project_type`

Allowed `visibility` values:

```txt
private
public
internal
```

Allowed `project_type` values:

```txt
web_app
api_service
cli
package
docs_site
electron_app
mobile_app
```

### `product`

```json
{
  "problem": "Freelancers need a simple way to create and send invoices.",
  "target_users": ["solo freelancers", "small agencies"],
  "mvp_goal": "Create, manage, and export invoices as PDFs.",
  "mvp_scope": ["Create clients", "Create invoices", "Export invoices as PDFs"],
  "non_goals": ["Payments", "Accounting integrations", "Multi-language support"]
}
```

Required:

- `problem`
- `target_users`
- `mvp_goal`
- `mvp_scope`
- `non_goals`

### `technical`

```json
{
  "stack": {
    "framework": "nextjs",
    "language": "typescript",
    "package_manager": "pnpm",
    "styling": "tailwind_v4",
    "ui": "shadcn_ui",
    "database": "postgres",
    "orm": "prisma",
    "auth": "authjs",
    "deployment": "vercel"
  },
  "validation_commands": ["pnpm typecheck", "pnpm lint", "pnpm build"],
  "risk_areas": ["authentication", "database_mutations", "pdf_generation"]
}
```

Required:

- `stack`
- `validation_commands`
- `risk_areas`

Supported stack values should be strict enums where possible.

### `workflow`

```json
{
  "preset": "safe_default",
  "default_branch": "main",
  "agent_provider": "cursor",
  "agent_command": "/agent build",
  "approval_policy": "safe_default",
  "max_files_without_human_review": 10
}
```

Allowed `preset` values:

```txt
solo_fast
safe_default
team_review
strict_production
```

Required:

- `preset`
- `default_branch`
- `agent_provider`
- `agent_command`
- `approval_policy`

MVP supports only:

```txt
agent_provider = cursor
```

### `files`

```json
{
  "generate": [
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
    ".aurora/project.json"
  ]
}
```

For MVP, Aurora should generate these files regardless of whether the JSON lists them, unless the user disables optional files.

### `milestones`

```json
[
  {
    "id": "milestone-001",
    "title": "Project foundation",
    "description": "Create the initial project skeleton and workflow foundation."
  }
]
```

### `tasks`

```json
[
  {
    "id": "task-001",
    "title": "Set up the project skeleton",
    "milestone": "Project foundation",
    "type": "setup",
    "priority": "high",
    "risk": "low",
    "goal": "Create the initial app structure, tooling, and baseline UI shell.",
    "context": "The project uses Next.js, TypeScript, Tailwind CSS v4, shadcn/ui, and pnpm.",
    "acceptance_criteria": [
      "Create the initial Next.js app structure.",
      "Add a basic home page.",
      "Add a shared layout.",
      "Ensure the app builds successfully."
    ],
    "likely_files": ["app/layout.tsx", "app/page.tsx", "package.json"],
    "constraints": [
      "Do not add authentication yet.",
      "Do not add database persistence yet.",
      "Do not introduce extra dependencies unless required by the selected stack."
    ],
    "validation": ["pnpm typecheck", "pnpm lint", "pnpm build"],
    "labels": ["aurora:agent-task", "type:setup", "risk:low", "priority:high"],
    "review_routing": ["frontend"],
    "agent_kickoff": {
      "command": "/agent build",
      "prompt": "Build this issue as a small focused PR. Implement only the initial project skeleton and baseline UI shell. Do not add auth, database persistence, billing, or deployment configuration in this PR. Run validation commands and include notes in the PR body.",
      "expected_pr_size": "small",
      "human_review_required": false
    }
  }
]
```

Required per task:

- `id`
- `title`
- `type`
- `priority`
- `risk`
- `goal`
- `acceptance_criteria`
- `validation`
- `agent_kickoff`

Allowed task types:

```txt
setup
implementation
refactor
docs
validation
research
```

Allowed risk values:

```txt
low
medium
high
```

Allowed priorities:

```txt
low
medium
high
```

## 13. JSON validation rules

Aurora validates before repo creation.

### Hard errors

Block creation when:

- JSON is invalid.
- `schema_version` is missing or unsupported.
- `project.repo_name` is missing.
- `project.repo_name` contains invalid GitHub repo characters.
- `project.name` is missing.
- `project.project_type` is unsupported.
- `project.visibility` is unsupported.
- `technical.validation_commands` is empty.
- `workflow.agent_provider` is not `cursor`.
- `tasks` is empty.
- Any task has no acceptance criteria.
- Any task has no validation commands.
- Any task has no `agent_kickoff.prompt`.
- Any generated file path is unsafe.
- Any generated file path attempts path traversal.

### Warnings

Allow creation, but show warnings for:

- auth is `none` but tasks mention protected routes
- database is `none` but tasks mention saved records
- no risk areas declared
- no default branch specified
- no human review required for high-risk task
- first task looks too large
- validation commands do not include build or typecheck
- deployment target is missing
- no non-goals listed

## 14. Generated repository files

Aurora commits generated files directly to the new repo’s default branch.

For existing repos later, Aurora should open a setup PR instead.

### File: `.aurora/project.json`

Purpose: lets Aurora rediscover project metadata from GitHub.

```json
{
  "schema_version": "aurora.project.v1",
  "project_id": "tinyinvoices",
  "created_by": "aurora",
  "project_type": "web_app",
  "workflow_preset": "safe_default",
  "agent_provider": "cursor",
  "agent_command": "/agent build",
  "default_branch": "main",
  "task_label": "aurora:agent-task",
  "branch_prefix": "cursor/task-",
  "created_at": "2026-06-30"
}
```

### File: `SPEC.md`

Human-readable version of the launch brief.

Include:

- project name
- description
- problem
- target users
- MVP goal
- MVP scope
- non-goals
- stack
- validation commands
- risk areas
- milestones
- tasks summary

### File: `README.md`

Include:

- project name
- description
- MVP summary
- stack
- getting started
- validation commands
- agent workflow note
- link to `SPEC.md`
- link to `AGENTS.md`

### File: `AGENTS.md`

Purpose: repo operating manual for agents.

Should include:

- project purpose
- architecture assumptions
- stack
- important directories
- setup commands
- validation commands
- agent PR expectations
- high-risk areas
- forbidden actions
- issue workflow
- PR workflow

Template content:

```md
# Agent instructions

## Project purpose

This repository contains {{project.description}}.

## Stack

- Framework: {{technical.stack.framework}}
- Language: {{technical.stack.language}}
- Package manager: {{technical.stack.package_manager}}
- Styling: {{technical.stack.styling}}
- UI: {{technical.stack.ui}}
- Database: {{technical.stack.database}}
- Auth: {{technical.stack.auth}}
- Deployment: {{technical.stack.deployment}}

## Validation commands

Run these before opening a PR:

{{validation_commands}}

## Agent workflow

Work from GitHub issues labeled `aurora:agent-task`.

Each PR must:

- link to its source issue
- satisfy all acceptance criteria
- include validation notes
- stay focused on the requested task
- avoid unrelated refactors

## High-risk areas

{{risk_areas}}

Do not modify high-risk areas unless the issue explicitly asks for it.

## Forbidden actions

Do not commit:

- secrets
- `.env` files
- build artifacts
- local database files
- debug logs

Do not introduce new dependencies unless the issue explicitly allows it.
```

### File: `BUGBOT.md`

Purpose: repo-specific Bugbot review rules.

```md
# Bugbot review rules

Focus on:

- correctness bugs
- security issues
- broken edge cases
- data loss risks
- auth and permission mistakes
- missing validation
- unsafe webhook handling
- workspace or tenant scoping mistakes
- unsafe database mutations
- accidental exposure of secrets or tokens

Ignore:

- cosmetic formatting unless it affects readability
- minor naming preferences
- unrelated refactors
- changes outside the PR scope

## Project-specific risk areas

{{risk_areas}}

## Framework-specific checks

{{framework_specific_checks}}
```

For Next.js, include:

```md
For Next.js apps:

- check server/client boundary mistakes
- check unsafe server actions
- check auth checks on protected routes
- check database mutations for workspace scoping
- check route handlers for input validation
- check cache invalidation after mutations
```

### File: `APPROVAL_POLICY.md`

Purpose: approval rules for humans and Approval Agents.

```md
# Approval policy

Approval Agent may approve PRs only when:

- The PR is linked to a GitHub issue.
- The PR satisfies all acceptance criteria.
- CI checks pass.
- Bugbot reports no unresolved high-risk findings.
- The diff does not touch auth, billing, secrets, migrations, deployment config, or other high-risk areas unless explicitly allowed.
- The PR changes fewer than {{max_files_without_human_review}} files.
- The PR includes validation notes.
- The PR does not introduce new dependencies unless explicitly allowed.

Approval Agent must request human review when:

- The PR touches authentication or authorization.
- The PR touches database migrations.
- The PR changes CI/CD configuration.
- The PR introduces new dependencies.
- The PR modifies security-sensitive code.
- The PR changes deployment, billing, payments, webhooks, or secrets.
- The PR changes public API behavior.
```

### File: `.cursor/rules/project.mdc`

Purpose: Cursor working rules.

```md
---
description: Project rules for agent work in this repository
alwaysApply: true
---

# Project rules

Use the existing stack and conventions.

Do not introduce new frameworks, state managers, ORMs, styling systems, or test runners unless the issue explicitly asks for it.

Prefer small, reviewable changes.

Before opening a PR:

1. Run the validation commands from `AGENTS.md`.
2. Update docs if behavior changed.
3. Add screenshots for UI changes.
4. Include risks and manual test notes in the PR body.

Never commit:

- secrets
- generated `.env` files
- build artifacts
- local database files
- debug logs
```

### File: `.cursor/approval-policies/ROUTING.md`

Purpose: reviewer routing policy.

```md
# Reviewer routing

Route PRs touching:

- `db/**`, `drizzle/**`, or `prisma/**` to database reviewer
- `auth/**`, `middleware.ts`, or `lib/auth/**` to auth reviewer
- `.github/**` to platform reviewer
- `app/api/**` to backend reviewer
- `components/**` to frontend reviewer
- `packages/sdk/**` to SDK reviewer
- `docs/**` to docs reviewer

If no specific owner applies, request review from the default maintainer.

If multiple owners apply, request all relevant reviewers.
```

### File: `.github/ISSUE_TEMPLATE/agent-task.md`

````md
---
name: Agent task
about: A scoped task intended for Cursor Cloud Agent
title: "[agent] "
labels: aurora:agent-task
---

## Goal

What should change?

## Context

Why is this needed?

## Acceptance criteria

- [ ]

## Files or areas likely involved

-

## Constraints

- Do not change:
- Keep existing behavior for:
- Avoid new dependencies unless necessary.

## Validation

Run:

- [ ]

## Agent kickoff

Command:

`/agent build`

Prompt:

```txt
Build this issue as a small focused PR. Satisfy the acceptance criteria, run validation commands, and include validation notes in the PR body.
```
````

````

### File: `.github/pull_request_template.md`

```md
<!-- aurora:pr {"source_task_id":"","source_issue":"","agent":"cursor"} -->

## Summary

What changed?

## Linked issue

Closes #

## Acceptance criteria

- [ ]

## Validation

Commands run:

- [ ]

## Risk notes

What could break?

## Screenshots or artifacts

Add screenshots for UI changes.

## Agent notes

Was this PR created or modified by an agent?

- [ ] Cursor Cloud Agent
- [ ] Human
- [ ] Mixed
````

### File: `.github/workflows/agent-validation.yml`

Only generate if validation commands are known.

Basic template:

```yaml
name: Agent validation

on:
  pull_request:
    branches:
      - main

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build
```

Adjust based on package manager.

## 15. GitHub labels

Aurora should create labels:

```txt
aurora
aurora:agent-task
aurora:in-progress
aurora:blocked
aurora:needs-human
aurora:ready-for-agent
agent:cursor
risk:low
risk:medium
risk:high
priority:low
priority:medium
priority:high
type:setup
type:implementation
type:docs
type:validation
type:research
```

## 16. GitHub milestones

Create GitHub milestones from `milestones`.

Each task referencing a milestone should be assigned to the matching GitHub milestone.

## 17. GitHub issues

Each task becomes one GitHub issue.

Issue title:

```txt
[agent] {{task.title}}
```

Issue body:

````md
<!-- aurora:task {"schema_version":"aurora.task.v1","task_id":"{{task.id}}","risk":"{{task.risk}}","agent":"cursor"} -->

## Goal

{{task.goal}}

## Context

{{task.context}}

## Acceptance criteria

{{acceptance_criteria_checklist}}

## Files or areas likely involved

{{likely_files}}

## Constraints

{{constraints}}

## Validation

{{validation_checklist}}

## Agent kickoff

Command:

`{{task.agent_kickoff.command}}`

Prompt:

```txt
{{task.agent_kickoff.prompt}}
```
````

## Review

Risk: {{task.risk}}

Human review required: {{task.agent_kickoff.human_review_required}}

````

Labels:

- `aurora`
- `aurora:agent-task`
- `agent:cursor`
- `risk:*`
- `priority:*`
- `type:*`

## 18. Workspace dashboard

MVP dashboard shows only selected Aurora workspaces.

### Workspace list

Columns/cards:

- repo name
- project type
- readiness score
- open agent tasks
- active tasks
- open PRs
- blocked PRs
- last activity
- status

Do not list all GitHub repos. Only list Aurora-enabled workspaces.

### Workspace detail

Show:

- project summary
- GitHub repo link
- readiness score
- installed files checklist
- initial tasks
- open issues
- Cursor setup checklist
- recent Aurora-created issues

MVP can read this from DB cache and GitHub on demand.

## 19. Readiness score

Calculate from generated/installed artifacts.

Score out of 100:

```txt
.aurora/project.json exists: 10
SPEC.md exists: 10
AGENTS.md exists: 15
BUGBOT.md exists: 10
APPROVAL_POLICY.md exists: 10
.cursor/rules/project.mdc exists: 10
.cursor/approval-policies/ROUTING.md exists: 10
GitHub issue template exists: 10
GitHub PR template exists: 10
Validation workflow exists: 5
````

For MVP-created repos, score should usually be 100 unless optional files are disabled.

## 20. Cursor setup checklist

After repo creation, show:

```txt
1. Open the repository in Cursor.
2. Enable GitHub integration.
3. Enable Bugbot for this repository.
4. Configure Approval Agents if available.
5. Review BUGBOT.md.
6. Review APPROVAL_POLICY.md.
7. Open the first GitHub issue.
8. Comment /agent build or use your Cursor Automation trigger.
```

Also show first recommended task:

```txt
Start with issue #1: {{first_task.title}}
Suggested command: /agent build
```

## 21. External LLM prompt template

Aurora should provide a copyable prompt.

```md
You are helping me create an Aurora launch brief.

Aurora is an AI-free app that turns a structured JSON launch brief into a GitHub repository, setup files, and agent-ready GitHub issues for Cursor agents.

Your job:

1. Interview me about the project.
2. Help me make concrete product and technical decisions.
3. Keep the MVP small.
4. Create small, focused implementation tasks.
5. Return strict JSON matching the Aurora launch brief schema.

Rules:

- Ask questions before producing JSON if important information is missing.
- Do not invent credentials, account names, private URLs, or secrets.
- Prefer explicit decisions over vague phrases.
- Break work into small PR-sized tasks.
- Every task must include acceptance criteria.
- Every task must include validation commands.
- Every task must include an agent kickoff prompt.
- Return only valid JSON in the final answer.

Use this schema_version:

aurora.launch_brief.v1

Required top-level keys:

- schema_version
- project
- product
- technical
- workflow
- files
- milestones
- tasks

Default choices unless I say otherwise:

- agent_provider: cursor
- agent_command: /agent build
- workflow preset: safe_default
- default branch: main
- visibility: private
```

## 22. Main app screens

### Screen: home

Primary actions:

- create new project
- prepare existing repo, disabled or “coming soon”
- view workspaces

### Screen: create new project

Steps:

1. Copy launch brief prompt
2. Paste launch brief JSON
3. Validate
4. Preview
5. Create GitHub repo
6. Done

### Screen: validation result

Show:

- valid or invalid
- hard errors
- warnings
- parsed project summary
- parsed tasks count
- generated files count

Actions:

- edit JSON
- continue to preview

### Screen: preview

Show tabs:

- files
- issues
- labels
- milestones

Actions:

- create repo
- go back

### Screen: workspace created

Show:

- GitHub repo link
- created files
- created issues
- Cursor setup checklist
- first issue recommendation

### Screen: workspaces

Show only Aurora-enabled repos.

### Screen: workspace detail

Show:

- readiness
- project brief
- files checklist
- tasks
- GitHub links
- Cursor setup

## 23. API routes

Recommended Next.js route handlers.

### `POST /api/launch-brief/validate`

Input:

```json
{
  "json": {}
}
```

Output:

```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "summary": {}
}
```

### `POST /api/workspaces/create-from-brief`

Input:

```json
{
  "launch_brief": {}
}
```

Does:

- validate brief again
- create GitHub repo
- create files
- create labels
- create milestones
- create issues
- create workspace row
- create workspace status row
- return workspace

### `GET /api/workspaces`

Returns selected Aurora workspaces only.

### `GET /api/workspaces/:id`

Returns workspace detail from DB cache.

### `POST /api/workspaces/:id/refresh`

Fetches selected repo from GitHub and rebuilds cached status.

### `POST /api/github/webhook`, later

Receives GitHub webhooks.

For MVP, can exist but simply verify signature and ignore unsupported events.

## 24. File generation service

Create internal service:

```txt
lib/aurora/generate-files.ts
```

Functions:

```ts
generateProjectJson(brief);
generateReadme(brief);
generateSpecMd(brief);
generateAgentsMd(brief);
generateBugbotMd(brief);
generateApprovalPolicyMd(brief);
generateCursorRules(brief);
generateRoutingPolicy(brief);
generateIssueTemplate(brief);
generatePullRequestTemplate(brief);
generateValidationWorkflow(brief);
```

Output shape:

```ts
type GeneratedFile = {
  path: string;
  content: string;
};
```

## 25. GitHub service

Create:

```txt
lib/github/client.ts
lib/github/repos.ts
lib/github/issues.ts
lib/github/labels.ts
lib/github/milestones.ts
```

Required functions:

```ts
createRepository(input);
createOrUpdateFile(repo, path, content, message);
createLabels(repo, labels);
createMilestones(repo, milestones);
createIssue(repo, issue);
getRepository(repo);
```

For committing multiple files, prefer creating one commit with the Git data API later. For MVP, individual file creation is acceptable, but one commit is cleaner.

## 26. Validation service

Create:

```txt
lib/aurora/validate-launch-brief.ts
```

Use Zod.

Validation output:

```ts
type ValidationResult = {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  normalized?: LaunchBrief;
};
```

## 27. Tech stack

Recommended build stack:

- Next.js 16
- App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Auth.js
- GitHub OAuth
- GitHub App
- Neon Postgres
- Prisma or Drizzle
- Zod
- Octokit

Use server components by default.

Use server actions or route handlers for mutations.

## 28. Non-goals for MVP

Do not build:

- AI integration
- Cursor API integration
- repo scanning for 200 repos
- full GitHub sync engine
- PR observer timeline
- learning extraction
- billing
- teams
- Slack integration
- Jira/Linear integration
- custom agent orchestration
- custom approval bot
- custom review bot
- template marketplace

## 29. MVP acceptance criteria

Aurora MVP is done when:

- User can sign in with GitHub.
- User can paste launch brief JSON.
- Aurora validates the JSON with errors and warnings.
- Aurora previews generated files and issues.
- Aurora creates a GitHub repo.
- Aurora commits generated setup files.
- Aurora creates labels.
- Aurora creates milestones.
- Aurora creates GitHub issues from tasks.
- Aurora stores one workspace row.
- Aurora shows the new workspace in the dashboard.
- Aurora shows a Cursor setup checklist.
- Aurora does not call an AI API.
- Aurora does not index unrelated GitHub repositories.

## 30. Suggested first implementation tasks

### Task 1: Set up Aurora app shell

Goal:

Create the base Next.js app with auth-ready layout and core routes.

Acceptance criteria:

- Next.js app created
- Tailwind and shadcn/ui installed
- base navigation added
- routes created for home, create project, workspaces
- app builds successfully

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### Task 2: Add launch brief schema and validator

Goal:

Implement strict JSON validation for `aurora.launch_brief.v1`.

Acceptance criteria:

- Zod schema exists
- validation service returns errors and warnings
- invalid JSON is handled cleanly
- supported enums are enforced
- warnings are generated for suspicious but allowed specs

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### Task 3: Build create project UI

Goal:

Create the UI for copying the external LLM prompt and pasting launch brief JSON.

Acceptance criteria:

- user can copy prompt template
- user can paste JSON
- user can validate JSON
- errors and warnings are displayed
- parsed summary is displayed

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### Task 4: Add generated files preview

Goal:

Generate files from a valid launch brief and preview them before repo creation.

Acceptance criteria:

- generated files service exists
- file list is shown
- selected file content can be previewed
- issue preview is shown
- labels and milestones preview is shown

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### Task 5: Add GitHub auth and app installation

Goal:

Allow the user to authenticate with GitHub and authorize Aurora.

Acceptance criteria:

- GitHub sign-in works
- session is available server-side
- GitHub App installation can be connected or linked
- unauthorized users cannot create repos

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### Task 6: Implement GitHub repo creation

Goal:

Create a new GitHub repository from a validated launch brief.

Acceptance criteria:

- repo is created with correct name and visibility
- duplicate repo names are handled gracefully
- errors are shown to user
- GitHub repo URL is returned

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### Task 7: Commit generated files

Goal:

Commit Aurora-generated setup files into the new repo.

Acceptance criteria:

- `.aurora/project.json` is created
- `README.md` is created
- `SPEC.md` is created
- `AGENTS.md` is created
- `BUGBOT.md` is created
- `APPROVAL_POLICY.md` is created
- Cursor files are created
- GitHub templates are created
- validation workflow is created when supported

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### Task 8: Create labels, milestones, and issues

Goal:

Create initial GitHub project structure from launch brief tasks.

Acceptance criteria:

- Aurora labels are created
- milestones are created
- one GitHub issue is created per task
- issue body includes hidden Aurora metadata
- issue body includes agent kickoff prompt
- issues are assigned to milestones where applicable

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### Task 9: Store workspace index

Goal:

Persist selected Aurora workspace metadata.

Acceptance criteria:

- database schema exists
- workspace row is created after repo creation
- workspace status row is created
- task index rows are created
- dashboard reads from DB

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

### Task 10: Build workspace dashboard

Goal:

Show selected Aurora workspaces and the details of a created workspace.

Acceptance criteria:

- workspace list shows only Aurora-enabled repos
- workspace detail shows readiness score
- workspace detail shows setup file checklist
- workspace detail shows created issues
- workspace detail links to GitHub repo and issues
- workspace detail shows Cursor setup checklist

Validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

## 31. Future phases

### Phase 2: prepare existing repo

- select existing repo
- scan selected repo only
- detect current setup files
- generate missing files
- open setup PR

### Phase 3: GitHub workflow observer

- receive GitHub webhooks
- update task and PR indexes
- show issue to PR timeline
- infer Cursor activity from comments, branches, PRs, and labels

### Phase 4: Cursor API integration, optional

- connect Cursor API key
- map Cursor runs to GitHub issues and PRs
- show actual run status
- fetch artifacts
- show usage

### Phase 5: learning suggestions

- detect repeated workflow failures
- propose updates to templates and policies
- open improvement PRs

## 32. Final product stance

Aurora is the deterministic bridge between planning and agent execution.

The user can think with any LLM.

Aurora turns the finished launch brief into GitHub reality.

GitHub stores the truth.

Cursor executes.

Bugbot reviews.

Approval Agents gate.

Aurora prepares, indexes, and improves the workspace.
