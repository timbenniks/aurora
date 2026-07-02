import { and, asc, eq, isNull, isNotNull } from "drizzle-orm"

import { db } from "@/db"
import { taskIndex, workspaces } from "@/db/schema"
import { createCursorAgent, getCursorRun } from "@/lib/cursor/agents"
import {
  getCursorApiKeyFromEnv,
  shouldAutoLaunchAgent,
} from "@/lib/cursor/env"
import { CursorApiError } from "@/lib/cursor/errors"
import { buildCursorAgentPrompt } from "@/lib/cursor/prompt"
import type { CursorRunStatus } from "@/lib/cursor/types"

export type LaunchAgentResult =
  | {
      ok: true
      taskId: string
      agentId: string
      runId: string
      runStatus: CursorRunStatus
      agentUrl: string
    }
  | {
      ok: false
      code: string
      error: string
    }

type LaunchTaskInput = {
  workspaceId: string
  taskId: string
  githubUserId: number
}

async function getLaunchContext(input: LaunchTaskInput) {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, input.workspaceId),
    with: {
      user: true,
      tasks: {
        where: eq(taskIndex.id, input.taskId),
        limit: 1,
      },
    },
  })

  if (!workspace || workspace.user.githubUserId !== input.githubUserId) {
    return null
  }

  const task = workspace.tasks[0]

  if (!task) {
    return null
  }

  return { workspace, task }
}

export async function launchAgentForTask(
  input: LaunchTaskInput
): Promise<LaunchAgentResult> {
  const context = await getLaunchContext(input)

  if (!context) {
    return {
      ok: false,
      code: "not_found",
      error: "Task or workspace not found.",
    }
  }

  const { workspace, task } = context

  if (task.cursorAgentId) {
    return {
      ok: false,
      code: "already_launched",
      error: "A Cursor agent is already linked to this task.",
    }
  }

  if (!task.agentPrompt?.trim()) {
    return {
      ok: false,
      code: "missing_prompt",
      error: "This task has no agent prompt.",
    }
  }

  const apiKey = getCursorApiKeyFromEnv()

  if (!apiKey) {
    return {
      ok: false,
      code: "cursor_not_connected",
      error: "Set the CURSOR_API_KEY environment variable first.",
    }
  }

  const repoUrl = `https://github.com/${workspace.fullName}`
  const promptText = buildCursorAgentPrompt({
    issueNumber: task.issueNumber,
    title: task.title,
    issueUrl: `${repoUrl}/issues/${task.issueNumber}`,
    agentPrompt: task.agentPrompt,
  })

  try {
    const created = await createCursorAgent(apiKey, {
      promptText,
      repoUrl,
      startingRef: workspace.defaultBranch,
      name: task.title,
      autoCreatePR: true,
    })

    const now = new Date()

    await db
      .update(taskIndex)
      .set({
        cursorAgentId: created.agent.id,
        cursorRunId: created.run.id,
        cursorRunStatus: created.run.status,
        cursorAgentUrl: created.agent.url,
        cursorLaunchedAt: now,
        status: "agent_running",
        updatedAt: now,
      })
      .where(eq(taskIndex.id, task.id))

    return {
      ok: true,
      taskId: task.id,
      agentId: created.agent.id,
      runId: created.run.id,
      runStatus: created.run.status,
      agentUrl: created.agent.url,
    }
  } catch (error) {
    if (error instanceof CursorApiError) {
      return {
        ok: false,
        code: "cursor_api_error",
        error: error.message,
      }
    }

    throw error
  }
}

export async function tryLaunchFirstAgent(input: {
  workspaceId: string
  githubUserId: number
}): Promise<LaunchAgentResult | { ok: false; code: "skipped" }> {
  if (!shouldAutoLaunchAgent()) {
    return { ok: false, code: "skipped" }
  }

  const firstTask = await db.query.taskIndex.findFirst({
    where: and(
      eq(taskIndex.workspaceId, input.workspaceId),
      isNull(taskIndex.cursorAgentId)
    ),
    orderBy: [asc(taskIndex.issueNumber)],
    columns: { id: true },
  })

  if (!firstTask) {
    return { ok: false, code: "skipped" }
  }

  return launchAgentForTask({
    workspaceId: input.workspaceId,
    taskId: firstTask.id,
    githubUserId: input.githubUserId,
  })
}

const TERMINAL_RUN_STATUSES = new Set<CursorRunStatus>([
  "FINISHED",
  "ERROR",
  "CANCELLED",
  "EXPIRED",
])

export async function refreshCursorRunStatuses(input: {
  workspaceId: string
}): Promise<{ updated: number }> {
  const apiKey = getCursorApiKeyFromEnv()

  if (!apiKey) {
    return { updated: 0 }
  }

  const tasks = await db.query.taskIndex.findMany({
    where: and(
      eq(taskIndex.workspaceId, input.workspaceId),
      isNotNull(taskIndex.cursorAgentId),
      isNotNull(taskIndex.cursorRunId)
    ),
    columns: {
      id: true,
      cursorAgentId: true,
      cursorRunId: true,
      cursorRunStatus: true,
    },
  })

  let updated = 0

  for (const task of tasks) {
    if (
      task.cursorRunStatus &&
      TERMINAL_RUN_STATUSES.has(task.cursorRunStatus as CursorRunStatus)
    ) {
      continue
    }

    try {
      const run = await getCursorRun(
        apiKey,
        task.cursorAgentId!,
        task.cursorRunId!
      )

      if (run.status === task.cursorRunStatus) {
        continue
      }

      const now = new Date()
      const taskStatus =
        run.status === "FINISHED"
          ? "agent_done"
          : run.status === "ERROR" ||
              run.status === "CANCELLED" ||
              run.status === "EXPIRED"
            ? "agent_failed"
            : "agent_running"

      await db
        .update(taskIndex)
        .set({
          cursorRunStatus: run.status,
          status: taskStatus,
          updatedAt: now,
        })
        .where(eq(taskIndex.id, task.id))

      updated += 1
    } catch (error) {
      if (error instanceof CursorApiError && error.status === 404) {
        continue
      }

      throw error
    }
  }

  return { updated }
}
