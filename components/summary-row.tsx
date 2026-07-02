import { cn } from "@/lib/utils"

type SummaryRowProps = {
  label: string
  value: string | number
  valueClassName?: string
}

/** A label/value row for definition lists inside panels. */
export function SummaryRow({ label, value, valueClassName }: SummaryRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b-2 border-border-subtle py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className={cn("text-lg", valueClassName)}>{value}</dd>
    </div>
  )
}
