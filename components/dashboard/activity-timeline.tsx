import { formatRelativeTime } from "@/lib/aurora/format"
import { cn } from "@/lib/utils"

type ActivityItem = {
  id: string
  title: string
  timestamp: string
}

type ActivityTimelineProps = {
  items: ActivityItem[]
  className?: string
}

export function ActivityTimeline({ items, className }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <p className={cn("text-base text-muted-foreground", className)}>
        No recent activity yet.
      </p>
    )
  }

  return (
    <ol className={cn("flex flex-col gap-4", className)}>
      {items.map((item) => (
        <li key={item.id} className="border-l-2 border-[#1a2540] pl-4">
          <p className="text-lg">{item.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatRelativeTime(item.timestamp)}
          </p>
        </li>
      ))}
    </ol>
  )
}
