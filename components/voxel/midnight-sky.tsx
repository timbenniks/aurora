import { cn } from "@/lib/utils"

export function MidnightSky({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 voxel-midnight-sky",
        className
      )}
    />
  )
}
