"use client"

import { MenuIcon } from "lucide-react"

import { AppSidebarBrand } from "@/components/app-sidebar-brand"
import { Button } from "@/components/ui/button"
import { mobileHeaderClass } from "@/lib/aurora/layout"

type MobileHeaderProps = {
  onOpenMenu: () => void
}

export function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
  return (
    <header className={mobileHeaderClass}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Open navigation menu"
        onClick={onOpenMenu}
      >
        <MenuIcon strokeWidth={2.5} />
      </Button>
      <AppSidebarBrand />
    </header>
  )
}
