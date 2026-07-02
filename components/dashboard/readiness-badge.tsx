import { cn } from "@/lib/utils"

type ReadinessBadgeProps = {
  score: number
  className?: string
}

function tone(score: number): string {
  if (score >= 100) {
    return "text-success border-success/40 bg-success/10"
  }

  if (score >= 70) {
    return "text-primary border-primary/40 bg-primary/10"
  }

  return "text-warning border-warning/40 bg-warning/10"
}

export function ReadinessBadge({ score, className }: ReadinessBadgeProps) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-md border-2 px-2.5 py-1 text-center",
        tone(score),
        className
      )}
    >
      <span className="block text-xs uppercase tracking-wide">Ready</span>
      <span className="block text-lg font-medium tabular-nums">{score}</span>
    </div>
  )
}
