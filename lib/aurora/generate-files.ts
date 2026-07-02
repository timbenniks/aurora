import type { LaunchBrief, GeneratedFile } from "@/lib/aurora/types"
import { DEFAULT_GENERATE_FILES } from "@/lib/aurora/types"
import { isSafeGeneratedFilePath } from "@/lib/aurora/validate-launch-brief"

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n")
}

function numberedCommands(items: string[]): string {
  return items.map((command, index) => `${index + 1}. \`${command}\``).join("\n")
}

function stackSection(brief: LaunchBrief): string {
  const { stack } = brief.technical

  return bulletList([
    `Framework: ${stack.framework}`,
    `Language: ${stack.language}`,
    `Package manager: ${stack.package_manager}`,
    `Styling: ${stack.styling}`,
    `UI: ${stack.ui}`,
    `Database: ${stack.database}`,
    `ORM: ${stack.orm}`,
    `Auth: ${stack.auth}`,
    `Deployment: ${stack.deployment}`,
  ])
}

function frameworkChecks(brief: LaunchBrief): string {
  if (brief.technical.stack.framework.toLowerCase().includes("next")) {
    return `For Next.js apps:

- check server/client boundary mistakes
- check unsafe server actions
- check auth checks on protected routes
- check database mutations for workspace scoping
- check route handlers for input validation
- check cache invalidation after mutations`
  }

  return "No framework-specific checks configured."
}

function installStep(brief: LaunchBrief): { name: string; run: string } {
  const pm = brief.technical.stack.package_manager.toLowerCase()

  if (pm === "pnpm") {
    return { name: "Install dependencies", run: "pnpm install --frozen-lockfile" }
  }

  if (pm === "yarn") {
    return { name: "Install dependencies", run: "yarn install --immutable" }
  }

  return { name: "Install dependencies", run: "npm ci" }
}

function setupSteps(brief: LaunchBrief): string {
  const pm = brief.technical.stack.package_manager.toLowerCase()
  const lines = [
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "",
    "      - name: Setup Node",
    "        uses: actions/setup-node@v4",
    "        with:",
    "          node-version: 22",
  ]

  if (pm === "pnpm") {
    lines.push(
      "",
      "      - name: Enable Corepack",
      "        run: corepack enable"
    )
  }

  const install = installStep(brief)
  lines.push("", `      - name: ${install.name}`, `        run: ${install.run}`)

  for (const command of brief.technical.validation_commands) {
    const stepName = command.replace(/^(pnpm|npm|yarn)\s+/, "")
    lines.push("", `      - name: ${stepName}`, `        run: ${command}`)
  }

  return lines.join("\n")
}

export function generateProjectJson(brief: LaunchBrief): string {
  const payload = {
    schema_version: "aurora.project.v1",
    project_id: brief.project.repo_name,
    created_by: "aurora",
    project_type: brief.project.project_type,
    workflow_preset: brief.workflow.preset,
    agent_provider: brief.workflow.agent_provider,
    agent_command: brief.workflow.agent_command,
    default_branch: brief.workflow.default_branch,
    task_label: "aurora:agent-task",
    branch_prefix: "cursor/task-",
    created_at: new Date().toISOString().slice(0, 10),
  }

  return `${JSON.stringify(payload, null, 2)}\n`
}

export function generateReadme(brief: LaunchBrief): string {
  return `# ${brief.project.name}

${brief.project.description}

## MVP

${brief.product.mvp_goal}

## Stack

${stackSection(brief)}

## Getting started

\`\`\`bash
${brief.technical.stack.package_manager} install
${brief.technical.stack.package_manager} dev
\`\`\`

## Validation

${numberedCommands(brief.technical.validation_commands)}

## Agent workflow

Work from GitHub issues labeled \`aurora:agent-task\`. See [AGENTS.md](./AGENTS.md) for repository rules.

## More detail

- [SPEC.md](./SPEC.md) — product and technical brief
- [AGENTS.md](./AGENTS.md) — agent operating manual
`
}

export function generateSpecMd(brief: LaunchBrief): string {
  const taskSummary = brief.tasks
    .map(
      (task) =>
        `- **${task.title}** (${task.type}, ${task.priority} priority, ${task.risk} risk)`
    )
    .join("\n")

  const milestoneSummary =
    brief.milestones.length > 0
      ? brief.milestones
          .map((milestone) => `- ${milestone.title}: ${milestone.description}`)
          .join("\n")
      : "- No milestones defined."

  return `# ${brief.project.name}

${brief.project.description}

## Problem

${brief.product.problem}

## Target users

${bulletList(brief.product.target_users)}

## MVP goal

${brief.product.mvp_goal}

## MVP scope

${bulletList(brief.product.mvp_scope)}

## Non-goals

${bulletList(brief.product.non_goals)}

## Stack

${stackSection(brief)}

## Validation commands

${numberedCommands(brief.technical.validation_commands)}

## Risk areas

${bulletList(brief.technical.risk_areas)}

## Milestones

${milestoneSummary}

## Tasks

${taskSummary}
`
}

export function generateAgentsMd(brief: LaunchBrief): string {
  return `# Agent instructions

## Project purpose

This repository contains ${brief.project.description}.

## Stack

${stackSection(brief)}

## Validation commands

Run these before opening a PR:

${numberedCommands(brief.technical.validation_commands)}

## Agent workflow

Work from GitHub issues labeled \`aurora:agent-task\`.

Each PR must:

- link to its source issue
- satisfy all acceptance criteria
- include validation notes
- stay focused on the requested task
- avoid unrelated refactors

## High-risk areas

${bulletList(brief.technical.risk_areas)}

Do not modify high-risk areas unless the issue explicitly asks for it.

## Forbidden actions

Do not commit:

- secrets
- \`.env\` files
- build artifacts
- local database files
- debug logs

Do not introduce new dependencies unless the issue explicitly allows it.
`
}

export function generateBugbotMd(brief: LaunchBrief): string {
  return `# Bugbot review rules

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

${bulletList(brief.technical.risk_areas)}

## Framework-specific checks

${frameworkChecks(brief)}
`
}

export function generateApprovalPolicyMd(brief: LaunchBrief): string {
  const maxFiles = brief.workflow.max_files_without_human_review ?? 10

  return `# Approval policy

Approval Agent may approve PRs only when:

- The PR is linked to a GitHub issue.
- The PR satisfies all acceptance criteria.
- CI checks pass.
- Bugbot reports no unresolved high-risk findings.
- The diff does not touch auth, billing, secrets, migrations, deployment config, or other high-risk areas unless explicitly allowed.
- The PR changes fewer than ${maxFiles} files.
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
`
}

export function generateCursorRules(brief: LaunchBrief): string {
  return `---
description: Project rules for agent work in this repository
alwaysApply: true
---

# Project rules

Use the existing stack and conventions for ${brief.project.name}.

Do not introduce new frameworks, state managers, ORMs, styling systems, or test runners unless the issue explicitly asks for it.

Prefer small, reviewable changes.

Before opening a PR:

1. Run the validation commands from \`AGENTS.md\`.
2. Update docs if behavior changed.
3. Add screenshots for UI changes.
4. Include risks and manual test notes in the PR body.

Never commit:

- secrets
- generated \`.env\` files
- build artifacts
- local database files
- debug logs
`
}

export function generateRoutingPolicy(): string {
  return `# Reviewer routing

Route PRs touching:

- \`db/**\`, \`drizzle/**\`, or \`prisma/**\` to database reviewer
- \`auth/**\`, \`middleware.ts\`, or \`lib/auth/**\` to auth reviewer
- \`.github/**\` to platform reviewer
- \`app/api/**\` to backend reviewer
- \`components/**\` to frontend reviewer
- \`packages/sdk/**\` to SDK reviewer
- \`docs/**\` to docs reviewer

If no specific owner applies, request review from the default maintainer.

If multiple owners apply, request all relevant reviewers.
`
}

export function generateIssueTemplate(brief: LaunchBrief): string {
  return `---
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

\`${brief.workflow.agent_command}\`

Prompt:

\`\`\`txt
Build this issue as a small focused PR. Satisfy the acceptance criteria, run validation commands, and include validation notes in the PR body.
\`\`\`
`
}

export function generatePullRequestTemplate(): string {
  return `<!-- aurora:pr {"source_task_id":"","source_issue":"","agent":"cursor"} -->

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
`
}

export function generateValidationWorkflow(brief: LaunchBrief): string {
  return `name: Agent validation

on:
  pull_request:
    branches:
      - ${brief.workflow.default_branch}

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
${setupSteps(brief)}
`
}

const GENERATORS: Record<
  (typeof DEFAULT_GENERATE_FILES)[number],
  (brief: LaunchBrief) => string
> = {
  ".aurora/project.json": generateProjectJson,
  "README.md": generateReadme,
  "SPEC.md": generateSpecMd,
  "AGENTS.md": generateAgentsMd,
  "BUGBOT.md": generateBugbotMd,
  "APPROVAL_POLICY.md": generateApprovalPolicyMd,
  ".cursor/rules/project.mdc": generateCursorRules,
  ".cursor/approval-policies/ROUTING.md": generateRoutingPolicy,
  ".github/ISSUE_TEMPLATE/agent-task.md": generateIssueTemplate,
  ".github/pull_request_template.md": () => generatePullRequestTemplate(),
  ".github/workflows/agent-validation.yml": generateValidationWorkflow,
}

export function generateAllFiles(brief: LaunchBrief): GeneratedFile[] {
  const paths = new Set<string>(DEFAULT_GENERATE_FILES)

  for (const path of brief.files.generate) {
    if (isSafeGeneratedFilePath(path)) {
      paths.add(path)
    }
  }

  return [...paths]
    .filter((path) => path in GENERATORS)
    .sort()
    .map((path) => ({
      path,
      content: GENERATORS[path as keyof typeof GENERATORS](brief),
    }))
}

export { generateIssueBodies } from "@/lib/aurora/issue-format"
export { getDefaultLabels } from "@/lib/aurora/labels"
