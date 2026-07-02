import { LaunchAgentButton } from "@/components/dashboard/launch-agent-button"
import { ButtonLink } from "@/components/ui/button-link"
import { cn } from "@/lib/utils"
import {
  cursorRunStatusTone,
  formatCursorRunStatus,
  isCursorRunActive,
} from "@/lib/cursor/format"

const SETUP_ITEMS = [
  "Enable GitHub integration in Cursor if prompted.",
  "Enable Bugbot for this repository.",
  "Configure Approval Agents if available.",
  "Review BUGBOT.md and APPROVAL_POLICY.md in the repo.",
] as const

type CursorAgentPanelProps = {
  workspaceId: string
  cursorConnected: boolean
  firstTask?: {
    id: string
    issueNumber: number
    title: string
    url: string
    agentCommand: string | null
    cursorAgentId: string | null
    cursorRunId: string | null
    cursorRunStatus: string | null
    cursorAgentUrl: string | null
    cursorLaunchedAt: string | null
  }
  className?: string
}

function statusClassName(tone: ReturnType<typeof cursorRunStatusTone>) {
  switch (tone) {
    case "success":
      return "border-success/40 bg-success/10 text-success"
    case "primary":
      return "border-primary/40 bg-primary/10 text-primary"
    case "destructive":
      return "border-destructive/40 bg-destructive/15 text-destructive"
    case "warning":
      return "border-warning/40 bg-warning/10 text-warning"
    default:
      return "border-border-subtle bg-card/80 text-muted-foreground"
  }
}

export function CursorAgentPanel({
  workspaceId,
  cursorConnected,
  firstTask,
  className,
}: CursorAgentPanelProps) {
  const launched = Boolean(firstTask?.cursorAgentId)
  const tone = cursorRunStatusTone(firstTask?.cursorRunStatus)
  const active = isCursorRunActive(firstTask?.cursorRunStatus)

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div>
        <h2 className="text-sm text-muted-foreground">Cursor agent</h2>

        {!cursorConnected ? (
          <p className="mt-3 text-lg text-muted-foreground">
            Connect a Cursor API key in Settings to launch Cloud Agents from
            Aurora.
          </p>
        ) : launched ? (
          <div className="mt-4 flex flex-col gap-4">
            <div
              className={cn(
                "inline-flex w-fit rounded-md border-2 px-3 py-2 text-lg",
                statusClassName(tone)
              )}
            >
              {formatCursorRunStatus(firstTask?.cursorRunStatus)}
            </div>

            {firstTask?.cursorLaunchedAt ? (
              <p className="text-base text-muted-foreground">
                Launched for issue #{firstTask.issueNumber}: {firstTask.title}
              </p>
            ) : null}

            {active ? (
              <p className="text-base text-muted-foreground">
                The agent is working on your repo. Refresh to update status or
                open it in Cursor.
              </p>
            ) : null}

            {firstTask?.cursorAgentUrl ? (
              <ButtonLink href={firstTask.cursorAgentUrl} target="_blank">
                Open agent in Cursor
              </ButtonLink>
            ) : null}
          </div>
        ) : firstTask ? (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-lg">
              Ready to launch on issue #{firstTask.issueNumber}:{" "}
              {firstTask.title}
            </p>
            <LaunchAgentButton
              taskId={firstTask.id}
              workspaceId={workspaceId}
            />
          </div>
        ) : (
          <p className="mt-3 text-lg text-muted-foreground">
            No agent tasks indexed yet.
          </p>
        )}
      </div>

      {firstTask ? (
        <div className="border-t-2 border-border-subtle pt-4">
          <h3 className="text-sm text-muted-foreground">First task</h3>
          <p className="mt-2 text-lg">
            #{firstTask.issueNumber} {firstTask.title}
          </p>
          {firstTask.agentCommand ? (
            <p className="mt-2 text-base text-muted-foreground">
              Command: <code className="text-sm">{firstTask.agentCommand}</code>
            </p>
          ) : null}
          <ButtonLink className="mt-4" href={firstTask.url} target="_blank">
            Open issue on GitHub
          </ButtonLink>
        </div>
      ) : null}

      <div className="border-t-2 border-border-subtle pt-4">
        <h3 className="text-sm text-muted-foreground">One-time setup</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-base text-muted-foreground">
          {SETUP_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}
