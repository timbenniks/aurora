import { CursorAgentPanel } from "@/components/dashboard/cursor-agent-panel"
import { PrList } from "@/components/dashboard/pr-list"
import { DeleteWorkspaceDialog } from "@/components/dashboard/delete-workspace-dialog"
import { FilesChecklist } from "@/components/dashboard/files-checklist"
import { ReadinessBadge } from "@/components/dashboard/readiness-badge"
import { RefreshWorkspaceButton } from "@/components/dashboard/refresh-workspace-button"
import { WorkflowTimeline } from "@/components/dashboard/workflow-timeline"
import { Panel } from "@/components/panel"
import { SummaryRow } from "@/components/summary-row"
import { ButtonLink } from "@/components/ui/button-link"
import {
  formatProjectType,
  formatRelativeTime,
  formatWorkflowPreset,
} from "@/lib/aurora/format"
import { buildWorkflowTimeline } from "@/lib/aurora/workflow-timeline"
import type { WorkspaceDetail } from "@/lib/aurora/workspaces"

type WorkspaceDetailViewProps = {
  workspace: WorkspaceDetail
  cursorConnected: boolean
}

export function WorkspaceDetailView({
  workspace,
  cursorConnected,
}: WorkspaceDetailViewProps) {
  const firstTask = workspace.tasks[0]
  const workflowItems = buildWorkflowTimeline(
    workspace.tasks,
    workspace.pullRequests
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel interactive={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm text-muted-foreground">Project</h2>
              <p className="mt-2 text-2xl">{workspace.fullName}</p>
            </div>
            <ReadinessBadge score={workspace.status.readinessScore} />
          </div>

          <dl className="mt-6">
            <SummaryRow
              label="Type"
              value={formatProjectType(workspace.projectType)}
            />
            <SummaryRow
              label="Workflow"
              value={formatWorkflowPreset(workspace.workflowPreset)}
            />
            <SummaryRow label="Branch" value={workspace.defaultBranch} />
            <SummaryRow label="Visibility" value={workspace.visibility} />
            <SummaryRow
              label="Last activity"
              value={formatRelativeTime(workspace.lastActivityAt)}
            />
            <SummaryRow label="Open tasks" value={workspace.openAgentTasks} />
            <SummaryRow label="Open PRs" value={workspace.status.openAgentPrs} />
          </dl>

          <ButtonLink className="mt-6" href={workspace.url} target="_blank">
            Open on GitHub
          </ButtonLink>

          <RefreshWorkspaceButton className="mt-4" workspaceId={workspace.id} />
        </Panel>

        <Panel interactive={false}>
          <h2 className="text-sm text-muted-foreground">Installed files</h2>
          <FilesChecklist className="mt-4" status={workspace.status} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel interactive={false}>
          <h2 className="text-sm text-muted-foreground">Agent pull requests</h2>
          <PrList className="mt-4" pullRequests={workspace.pullRequests} />
        </Panel>

        <Panel interactive={false}>
          <CursorAgentPanel
            cursorConnected={cursorConnected}
            firstTask={
              firstTask
                ? {
                    id: firstTask.id,
                    issueNumber: firstTask.issueNumber,
                    title: firstTask.title,
                    url: firstTask.url,
                    agentCommand: firstTask.agentCommand,
                    cursorAgentId: firstTask.cursorAgentId,
                    cursorRunId: firstTask.cursorRunId,
                    cursorRunStatus: firstTask.cursorRunStatus,
                    cursorAgentUrl: firstTask.cursorAgentUrl,
                    cursorLaunchedAt: firstTask.cursorLaunchedAt,
                  }
                : undefined
            }
            workspaceId={workspace.id}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel interactive={false}>
          <h2 className="text-sm text-muted-foreground">Agent tasks</h2>
          {workspace.tasks.length === 0 ? (
            <p className="mt-4 text-base text-muted-foreground">
              No indexed issues yet.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {workspace.tasks.map((task) => (
                <li key={task.id}>
                  <a
                    className="text-lg text-primary underline-offset-4 hover:underline"
                    href={task.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    #{task.issueNumber} {task.title}
                  </a>
                  {task.priority ? (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {task.priority} priority
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel interactive={false}>
          <h2 className="text-sm text-muted-foreground">Workflow timeline</h2>
          {workflowItems.length === 0 ? (
            <p className="mt-4 text-base text-muted-foreground">
              No workflow events yet.
            </p>
          ) : (
            <WorkflowTimeline className="mt-4" items={workflowItems} />
          )}
        </Panel>
      </div>

      <DeleteWorkspaceDialog
        workspaceId={workspace.id}
        repoName={workspace.repo}
        fullName={workspace.fullName}
      />
    </div>
  )
}
