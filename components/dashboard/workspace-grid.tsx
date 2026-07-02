import { cn } from "@/lib/utils"

type WorkspaceGridProps = {
  children: React.ReactNode
  className?: string
}

export function WorkspaceGrid({ children, className }: WorkspaceGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  )
}
