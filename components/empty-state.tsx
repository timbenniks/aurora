import { Panel } from "@/components/panel"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Panel dashed className={cn("p-8 text-center sm:p-10", className)}>
      <p className="text-sm leading-relaxed">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xl text-muted-foreground">
        {description}
      </p>
      {action}
    </Panel>
  )
}
