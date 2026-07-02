import { AppNav } from "@/components/app-nav"
import { AppSidebarBrand } from "@/components/app-sidebar-brand"
import { ButtonLink } from "@/components/ui/button-link"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  return (
    <aside
      className={cn(
        "relative z-20 hidden w-64 shrink-0 flex-col border-r-2 border-border-subtle",
        "bg-muted/95 shadow-[4px_0_0_0_var(--voxel-shadow)] md:flex"
      )}
    >
      <div className="border-b-2 border-border-subtle px-4 py-4">
        <AppSidebarBrand />
      </div>
      <AppNav />
      <div className="mt-auto border-t-2 border-border-subtle p-3">
        <ButtonLink
          className={cn("w-full justify-center text-xs")}
          href="/settings"
          variant="outline"
        >
          GitHub account
        </ButtonLink>
      </div>
    </aside>
  )
}
