/** Default GitHub labels Aurora creates for every workspace. */
export const DEFAULT_LABELS = [
  "aurora",
  "aurora:agent-task",
  "aurora:in-progress",
  "aurora:blocked",
  "aurora:needs-human",
  "aurora:ready-for-agent",
  "agent:cursor",
  "risk:low",
  "risk:medium",
  "risk:high",
  "priority:low",
  "priority:medium",
  "priority:high",
  "type:setup",
  "type:implementation",
  "type:docs",
  "type:validation",
  "type:research",
  "type:refactor",
] as const

export function getDefaultLabels(): string[] {
  return [...DEFAULT_LABELS]
}
