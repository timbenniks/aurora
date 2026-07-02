import { auth } from "@/auth"
import { CursorApiKeyForm } from "@/components/settings/cursor-api-key-form"
import { FeaturePanel } from "@/components/panel"
import { SummaryRow } from "@/components/summary-row"
import { getCursorConnectionStatus } from "@/lib/cursor/credentials"

export async function CursorConnectionPanel() {
  const session = await auth()
  const signedIn = Boolean(session?.user)
  const status = session?.githubUserId
    ? await getCursorConnectionStatus(session.githubUserId)
    : { connected: false, autoLaunchAgent: true }

  return (
    <FeaturePanel
      title="Cursor Cloud Agents"
      description="Connect your Cursor API key so Aurora can launch Cloud Agents on new workspaces and track run status."
    >
      <dl className="mt-4">
        <SummaryRow
          label="API key"
          value={
            status.connected
              ? status.apiKeyName
                ? `${status.apiKeyName} (${status.apiKeyHint})`
                : `Connected (${status.apiKeyHint})`
              : "Not connected"
          }
          valueClassName={
            status.connected ? "text-success" : "text-muted-foreground"
          }
        />
        <SummaryRow
          label="Auto-launch"
          value={status.autoLaunchAgent ? "On" : "Off"}
          valueClassName={
            status.autoLaunchAgent ? "text-success" : "text-muted-foreground"
          }
        />
      </dl>

      {signedIn ? (
        <CursorApiKeyForm
          apiKeyHint={status.apiKeyHint}
          apiKeyName={status.apiKeyName}
          autoLaunchAgent={status.autoLaunchAgent}
          connected={status.connected}
        />
      ) : (
        <p className="mt-6 text-lg text-muted-foreground">
          Sign in to connect a Cursor API key.
        </p>
      )}
    </FeaturePanel>
  )
}
