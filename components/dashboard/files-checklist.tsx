import type { ReadinessFlags } from "@/lib/aurora/readiness"
import { buildReadinessChecklist } from "@/lib/aurora/readiness-checklist"
import { cn } from "@/lib/utils"

type FilesChecklistProps = {
  status: ReadinessFlags
  className?: string
}

export function FilesChecklist({ status, className }: FilesChecklistProps) {
  const items = buildReadinessChecklist(status)

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-3 text-lg"
        >
          <span
            className={cn(
              "w-4 shrink-0 text-center font-pixel text-sm",
              item.installed ? "text-success" : "text-muted-foreground"
            )}
            aria-hidden
          >
            {item.installed ? "✓" : "○"}
          </span>
          <span
            className={cn(
              item.installed ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  )
}
