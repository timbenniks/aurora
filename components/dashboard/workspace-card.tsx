import Link from "next/link"

import { Panel } from "@/components/panel"
import { ReadinessBadge } from "@/components/dashboard/readiness-badge"
import {
  formatProjectType,
  formatRelativeTime,
} from "@/lib/aurora/format"
import type { WorkspaceListItem } from "@/lib/aurora/workspaces"
import { cn } from "@/lib/utils"

type WorkspaceCardProps = {
  workspace: WorkspaceListItem
  className?: string
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg tabular-nums">{value}</span>
    </div>
  )
}

export function WorkspaceCard({ workspace, className }: WorkspaceCardProps) {
  return (
    <Link href={`/workspaces/${workspace.id}`} className={cn("block", className)}>
      <Panel className="h-full transition-colors hover:border-primary/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg">{workspace.fullName}</h3>
            <p className="mt-1 text-base text-muted-foreground">
              {formatProjectType(workspace.projectType)}
            </p>
          </div>
          <ReadinessBadge score={workspace.readinessScore} />
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-4">
          <Metric label="Open tasks" value={workspace.openAgentTasks} />
          <Metric label="Open PRs" value={workspace.openAgentPrs} />
          <Metric label="Blocked" value={workspace.blockedPrs} />
        </dl>

        <p className="mt-5 text-sm text-muted-foreground">
          Active {formatRelativeTime(workspace.lastActivityAt)}
        </p>
      </Panel>
    </Link>
  )
}
