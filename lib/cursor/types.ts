export type CursorRunStatus =
  | "CREATING"
  | "RUNNING"
  | "FINISHED"
  | "ERROR"
  | "CANCELLED"
  | "EXPIRED"

export type CursorAgentStatus = "ACTIVE" | "ARCHIVED"

export type CursorAgent = {
  id: string
  name: string
  status: CursorAgentStatus
  url: string
  latestRunId?: string
  createdAt: string
  updatedAt: string
}

export type CursorRun = {
  id: string
  agentId: string
  status: CursorRunStatus
  createdAt: string
  updatedAt: string
  durationMs?: number
  result?: string
  git?: {
    branches: Array<{
      repoUrl: string
      branch?: string
      prUrl?: string
    }>
  }
}

export type CreateCursorAgentInput = {
  promptText: string
  repoUrl: string
  startingRef: string
  name?: string
  autoCreatePR?: boolean
}

export type CreateCursorAgentResult = {
  agent: CursorAgent
  run: CursorRun
}
