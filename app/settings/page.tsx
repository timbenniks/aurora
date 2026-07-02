import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { CursorConnectionPanel } from "@/components/settings/cursor-connection"
import { GitHubConnectionPanel } from "@/components/settings/github-connection"

export default function SettingsPage() {
  return (
    <PageFrame>
      <PageHeader
        title="Settings"
        description="Connect GitHub and Cursor, and manage integrations for Aurora workspaces."
      />

      <div className="flex flex-col gap-6">
        <GitHubConnectionPanel />
        <CursorConnectionPanel />
      </div>
    </PageFrame>
  )
}
