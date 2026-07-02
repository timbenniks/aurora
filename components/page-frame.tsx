import { PageContent } from "@/components/page-content"
import { pageGapClass } from "@/lib/aurora/layout"
import { cn } from "@/lib/utils"

export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <PageContent>
      <div className={cn("flex flex-col", pageGapClass)}>{children}</div>
    </PageContent>
  )
}
