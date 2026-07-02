import { ActivityTimeline } from "@/components/dashboard/activity-timeline"
import type { WorkflowTimelineItem } from "@/lib/aurora/workflow-timeline"

type WorkflowTimelineProps = {
  items: WorkflowTimelineItem[]
  className?: string
}

export function WorkflowTimeline({ items, className }: WorkflowTimelineProps) {
  return (
    <ActivityTimeline
      className={className}
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        timestamp: item.timestamp,
      }))}
    />
  )
}
