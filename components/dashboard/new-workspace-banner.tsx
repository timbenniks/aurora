import { Panel } from "@/components/panel"
import { formatCursorRunStatus } from "@/lib/cursor/format"

type NewWorkspaceBannerProps = {
  fullName: string
  cursorConnected: boolean
  firstTask?: {
    cursorAgentId: string | null
    cursorRunStatus: string | null
    issueNumber: number
    title: string
  }
}

export function NewWorkspaceBanner({
  fullName,
  cursorConnected,
  firstTask,
}: NewWorkspaceBannerProps) {
  const launched = Boolean(firstTask?.cursorAgentId)

  return (
    <Panel interactive={false} className="border-success/30">
      <p className="text-lg text-success">
        {fullName} is bootstrapped and ready.
        {launched
          ? ` Cursor agent launched for issue #${firstTask?.issueNumber} (${formatCursorRunStatus(firstTask?.cursorRunStatus)}).`
          : cursorConnected
            ? " Launch the first Cursor agent below when you are ready."
            : " Connect a Cursor API key in Settings to launch agents automatically."}
      </p>
    </Panel>
  )
}
