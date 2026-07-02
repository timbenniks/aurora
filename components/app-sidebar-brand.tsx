import Link from "next/link"

import { auroraGradientTextClass } from "@/lib/aurora/classes"
import { cn } from "@/lib/utils"

type AppSidebarBrandProps = {
  onNavigate?: () => void
}

export function AppSidebarBrand({ onNavigate }: AppSidebarBrandProps) {
  return (
    <Link href="/" className="flex flex-col gap-1" onClick={onNavigate}>
      <span
        className={cn(
          "font-pixel-heading text-sm leading-none",
          auroraGradientTextClass
        )}
      >
        Aurora
      </span>
      <span className="text-lg leading-tight text-sidebar-foreground/60">
        Tim&apos;s token furnace
      </span>
    </Link>
  )
}
