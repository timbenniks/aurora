import { pagePaddingClass } from "@/lib/aurora/layout"
import { cn } from "@/lib/utils"

export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-[1600px] flex-1",
        pagePaddingClass,
        className
      )}
    >
      {children}
    </main>
  )
}
