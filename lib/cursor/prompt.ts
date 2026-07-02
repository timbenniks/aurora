export function buildCursorAgentPrompt(input: {
  issueNumber: number
  title: string
  issueUrl: string
  agentPrompt: string
}): string {
  return `Work on GitHub issue #${input.issueNumber}: ${input.title}
${input.issueUrl}

${input.agentPrompt}`
}
