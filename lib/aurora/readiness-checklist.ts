import type { ReadinessFlags } from "@/lib/aurora/readiness"

export const READINESS_CHECKLIST_ITEMS: Array<{
  label: string
  flag: keyof ReadinessFlags
}> = [
  { label: "AGENTS.md", flag: "hasAgentsMd" },
  { label: "BUGBOT.md", flag: "hasBugbotMd" },
  { label: "APPROVAL_POLICY.md", flag: "hasApprovalPolicy" },
  { label: ".cursor/rules/project.mdc", flag: "hasCursorRules" },
  { label: ".cursor/approval-policies/ROUTING.md", flag: "hasRoutingPolicy" },
  { label: "GitHub issue template", flag: "hasIssueTemplate" },
  { label: "GitHub PR template", flag: "hasPrTemplate" },
  { label: "Validation workflow", flag: "hasValidationWorkflow" },
]

export function buildReadinessChecklist(status: ReadinessFlags) {
  return READINESS_CHECKLIST_ITEMS.map((item) => ({
    label: item.label,
    installed: status[item.flag],
  }))
}
