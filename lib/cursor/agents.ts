import { cursorApiRequest } from "@/lib/cursor/client"
import type {
  CreateCursorAgentInput,
  CreateCursorAgentResult,
  CursorRun,
} from "@/lib/cursor/types"

export async function createCursorAgent(
  apiKey: string,
  input: CreateCursorAgentInput
): Promise<CreateCursorAgentResult> {
  return cursorApiRequest<CreateCursorAgentResult>("/v1/agents", apiKey, {
    method: "POST",
    body: JSON.stringify({
      prompt: { text: input.promptText },
      repos: [
        {
          url: input.repoUrl,
          startingRef: input.startingRef,
        },
      ],
      name: input.name,
      autoCreatePR: input.autoCreatePR ?? true,
    }),
  })
}

export async function getCursorRun(
  apiKey: string,
  agentId: string,
  runId: string
): Promise<CursorRun> {
  return cursorApiRequest<CursorRun>(
    `/v1/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`,
    apiKey
  )
}
