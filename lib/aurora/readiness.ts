export type ReadinessFlags = {
  hasAgentsMd: boolean
  hasBugbotMd: boolean
  hasApprovalPolicy: boolean
  hasCursorRules: boolean
  hasRoutingPolicy: boolean
  hasIssueTemplate: boolean
  hasPrTemplate: boolean
  hasValidationWorkflow: boolean
}

export type ReadinessResult = ReadinessFlags & {
  score: number
}

const READINESS_ARTIFACTS = [
  { paths: [".aurora/project.json"], points: 10 },
  { paths: ["SPEC.md"], points: 10 },
  { paths: ["AGENTS.md"], points: 15, flag: "hasAgentsMd" as const },
  { paths: ["BUGBOT.md"], points: 10, flag: "hasBugbotMd" as const },
  { paths: ["APPROVAL_POLICY.md"], points: 10, flag: "hasApprovalPolicy" as const },
  {
    paths: [".cursor/rules/project.mdc"],
    points: 10,
    flag: "hasCursorRules" as const,
  },
  {
    paths: [".cursor/approval-policies/ROUTING.md"],
    points: 10,
    flag: "hasRoutingPolicy" as const,
  },
  {
    paths: [".github/ISSUE_TEMPLATE/"],
    points: 10,
    flag: "hasIssueTemplate" as const,
    prefix: true,
  },
  {
    paths: [".github/pull_request_template.md"],
    points: 10,
    flag: "hasPrTemplate" as const,
  },
  {
    paths: [".github/workflows/agent-validation.yml"],
    points: 5,
    flag: "hasValidationWorkflow" as const,
  },
] as const

function pathMatches(filePaths: Set<string>, path: string, prefix?: boolean) {
  if (prefix) {
    return [...filePaths].some(
      (filePath) =>
        filePath === path || filePath.startsWith(path.replace(/\/$/, "") + "/")
    )
  }

  return filePaths.has(path)
}

export function calculateReadiness(filePaths: string[]): ReadinessResult {
  const paths = new Set(filePaths)
  const flags: ReadinessFlags = {
    hasAgentsMd: false,
    hasBugbotMd: false,
    hasApprovalPolicy: false,
    hasCursorRules: false,
    hasRoutingPolicy: false,
    hasIssueTemplate: false,
    hasPrTemplate: false,
    hasValidationWorkflow: false,
  }

  let score = 0

  for (const artifact of READINESS_ARTIFACTS) {
    const matched = artifact.paths.some((path) =>
      pathMatches(paths, path, "prefix" in artifact ? artifact.prefix : false)
    )

    if (matched) {
      score += artifact.points

      if ("flag" in artifact && artifact.flag) {
        flags[artifact.flag] = true
      }
    }
  }

  return { score, ...flags }
}
