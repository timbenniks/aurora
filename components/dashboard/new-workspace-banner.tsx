import { Panel } from "@/components/panel"

export function NewWorkspaceBanner({ fullName }: { fullName: string }) {
  return (
    <Panel interactive={false} className="border-success/30">
      <p className="text-lg text-success">
        {fullName} is bootstrapped and ready. Follow the Cursor setup checklist
        below to hand off to your agent.
      </p>
    </Panel>
  )
}
