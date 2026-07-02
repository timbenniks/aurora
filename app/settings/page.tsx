import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { GitHubConnectionPanel } from "@/components/settings/github-connection"

export default function SettingsPage() {
  return (
    <PageFrame>
      <PageHeader
        title="Settings"
        description="Connect GitHub and manage your Aurora GitHub App installation."
      />

      <GitHubConnectionPanel />
    </PageFrame>
  )
}
