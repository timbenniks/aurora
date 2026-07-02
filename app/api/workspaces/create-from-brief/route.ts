import { NextResponse } from "next/server"

import { getGitHubAccessToken } from "@/lib/auth/github-access-token"
import { requireGitHubSession } from "@/lib/auth/github-session"
import {
  createWorkspaceFromBrief,
  runWorkspaceCreateStep,
} from "@/lib/workspaces/create-repository-from-brief"
import { saveWorkspaceIndex } from "@/lib/workspaces/save-workspace-index"
import type { WorkspaceCreateStep } from "@/lib/workspaces/workspace-create-steps"

type CreateFromBriefBody = {
  launch_brief?: unknown
  bootstrap_only?: boolean
  step?: WorkspaceCreateStep
  repo?: {
    id: number
    owner: string
    name: string
    fullName: string
    url: string
    defaultBranch: string
  }
  milestone_map?: Record<string, number>
}

const WORKSPACE_STEPS = new Set<WorkspaceCreateStep>([
  "repo",
  "files",
  "labels",
  "milestones",
  "issues",
])

function buildHandoff(
  brief: { workflow: { agent_command: string } },
  issues: Array<{ number: number; title: string; url: string }>
) {
  const firstIssue = issues[0]

  return {
    agentCommand: brief.workflow.agent_command,
    firstIssue: firstIssue
      ? {
          number: firstIssue.number,
          title: firstIssue.title,
          url: firstIssue.url,
        }
      : undefined,
  }
}

async function persistCreatedWorkspace(input: {
  installationId: number
  brief: Parameters<typeof saveWorkspaceIndex>[0]["brief"]
  repo: NonNullable<Parameters<typeof saveWorkspaceIndex>[0]["repo"]>
  bootstrap: Parameters<typeof saveWorkspaceIndex>[0]["bootstrap"]
  bootstrapOnly?: boolean
}) {
  try {
    return await saveWorkspaceIndex(input)
  } catch (error) {
    console.error("Workspace index persist failed:", error)

    return {
      error: "Repository was created on GitHub but Aurora could not save the workspace index.",
      code: "db_persist_failed",
    }
  }
}

export async function POST(request: Request) {
  const session = await requireGitHubSession()

  if ("error" in session) {
    return NextResponse.json(
      { error: session.error, code: session.code },
      { status: session.status }
    )
  }

  let body: CreateFromBriefBody

  try {
    body = (await request.json()) as CreateFromBriefBody
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    )
  }

  if (body.launch_brief === undefined) {
    return NextResponse.json(
      { error: "launch_brief is required." },
      { status: 400 }
    )
  }

  const userAccessToken = await getGitHubAccessToken(request)

  if (body.step) {
    if (!WORKSPACE_STEPS.has(body.step)) {
      return NextResponse.json({ error: "Invalid step." }, { status: 400 })
    }

    const result = await runWorkspaceCreateStep(
      body.step,
      body.launch_brief,
      session.installationId,
      session.githubLogin,
      userAccessToken,
      {
        repo: body.repo,
        milestoneMap: body.milestone_map,
        bootstrapOnly: body.bootstrap_only === true,
        skipFiles: body.bootstrap_only === true,
      }
    )

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          errors: result.errors,
          repo: result.repo,
          partial: result.partial,
        },
        { status: result.status }
      )
    }

    const response: Record<string, unknown> = {
      step: result.step,
      summary: result.summary,
      repo: result.repo,
      milestoneMap: result.milestoneMap,
      partial: result.partial,
    }

    if (result.step === "issues") {
      response.handoff = buildHandoff(result.brief, result.partial?.issues ?? [])

      const persisted = await persistCreatedWorkspace({
        installationId: session.installationId,
        brief: result.brief,
        repo: result.repo,
        bootstrap: result.partial ?? {},
        bootstrapOnly: body.bootstrap_only === true,
      })

      if ("error" in persisted) {
        return NextResponse.json(
          {
            error: persisted.error,
            code: persisted.code,
            step: result.step,
            repo: result.repo,
            partial: result.partial,
            handoff: response.handoff,
          },
          { status: 500 }
        )
      }

      response.workspaceId = persisted.workspaceId
    }

    return NextResponse.json(response)
  }

  const result = await createWorkspaceFromBrief(
    body.launch_brief,
    session.installationId,
    session.githubLogin,
    userAccessToken,
    { bootstrapOnly: body.bootstrap_only === true }
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        code: result.code,
        errors: result.errors,
        repo: result.repo,
        bootstrap: result.bootstrap,
      },
      { status: result.status }
    )
  }

  const persisted = await persistCreatedWorkspace({
    installationId: session.installationId,
    brief: result.brief,
    repo: result.repo,
    bootstrap: result.bootstrap,
    bootstrapOnly: body.bootstrap_only === true,
  })

  if ("error" in persisted) {
    return NextResponse.json(
      {
        error: persisted.error,
        code: persisted.code,
        repo: {
          id: result.repo.id,
          owner: result.repo.owner,
          name: result.repo.name,
          fullName: result.repo.fullName,
          url: result.repo.url,
          defaultBranch: result.repo.defaultBranch,
        },
        bootstrap: {
          filesCommitted: result.bootstrap.filesCommitted,
          filePaths: result.bootstrap.filePaths,
          labelsCreated: result.bootstrap.labelsCreated,
          milestonesCreated: result.bootstrap.milestonesCreated,
          issues: result.bootstrap.issues,
          warnings: result.bootstrap.warnings,
        },
        handoff: buildHandoff(result.brief, result.bootstrap.issues),
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    workspaceId: persisted.workspaceId,
    repo: {
      id: result.repo.id,
      owner: result.repo.owner,
      name: result.repo.name,
      fullName: result.repo.fullName,
      url: result.repo.url,
      defaultBranch: result.repo.defaultBranch,
    },
    bootstrap: {
      filesCommitted: result.bootstrap.filesCommitted,
      filePaths: result.bootstrap.filePaths,
      labelsCreated: result.bootstrap.labelsCreated,
      milestonesCreated: result.bootstrap.milestonesCreated,
      issues: result.bootstrap.issues,
      warnings: result.bootstrap.warnings,
    },
    handoff: buildHandoff(result.brief, result.bootstrap.issues),
  })
}
