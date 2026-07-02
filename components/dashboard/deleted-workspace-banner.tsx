import { Panel } from "@/components/panel"

export function DeletedWorkspaceBanner() {
  return (
    <Panel interactive={false} className="border-success/30">
      <p className="text-lg text-success">
        Repository deleted from GitHub and removed from Aurora.
      </p>
    </Panel>
  )
}
