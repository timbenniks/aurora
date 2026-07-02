import type { ValidationMessage } from "@/lib/aurora/types"
import { cn } from "@/lib/utils"

type ValidationMessageListProps = {
  items: ValidationMessage[]
  tone: "error" | "warning"
  className?: string
}

export function ValidationMessageList({
  items,
  tone,
  className,
}: ValidationMessageListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul
      className={cn(
        "flex flex-col gap-2 text-lg",
        tone === "error" ? "text-destructive" : "text-warning",
        className
      )}
    >
      {items.map((item, index) => (
        <li key={`${item.code}-${item.path}-${index}`}>
          {item.path ? (
            <span className="font-pixel text-base text-muted-foreground">
              {item.path}:{" "}
            </span>
          ) : null}
          {item.message}
        </li>
      ))}
    </ul>
  )
}
