import type { LaunchBrief, GeneratedIssue } from "@/lib/aurora/types"

function checklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join("\n")
}

function bulletList(items: string[]): string {
  if (items.length === 0) {
    return "-"
  }

  return items.map((item) => `- ${item}`).join("\n")
}

function taskLabels(task: LaunchBrief["tasks"][number]): string[] {
  const labels = new Set<string>([
    "aurora",
    "aurora:agent-task",
    "agent:cursor",
    `risk:${task.risk}`,
    `priority:${task.priority}`,
    `type:${task.type}`,
  ])

  for (const label of task.labels ?? []) {
    labels.add(label)
  }

  return [...labels]
}

export function formatIssueBody(task: LaunchBrief["tasks"][number]): string {
  const metadata = JSON.stringify({
    schema_version: "aurora.task.v1",
    task_id: task.id,
    risk: task.risk,
    agent: "cursor",
  })

  const context = task.context?.trim() || "No additional context provided."
  const likelyFiles =
    task.likely_files && task.likely_files.length > 0
      ? bulletList(task.likely_files)
      : "-"
  const constraints =
    task.constraints && task.constraints.length > 0
      ? bulletList(task.constraints)
      : "-"

  return `<!-- aurora:task ${metadata} -->

## Goal

${task.goal}

## Context

${context}

## Acceptance criteria

${checklist(task.acceptance_criteria)}

## Files or areas likely involved

${likelyFiles}

## Constraints

${constraints}

## Validation

${checklist(task.validation)}

## Agent kickoff

Command:

\`${task.agent_kickoff.command}\`

Prompt:

\`\`\`txt
${task.agent_kickoff.prompt}
\`\`\`

## Review

Risk: ${task.risk}

Human review required: ${task.agent_kickoff.human_review_required ?? false}
`
}

export function generateIssueBodies(brief: LaunchBrief): GeneratedIssue[] {
  return brief.tasks.map((task) => ({
    taskId: task.id,
    title: `[agent] ${task.title}`,
    body: formatIssueBody(task),
    labels: taskLabels(task),
    milestone: task.milestone,
  }))
}
