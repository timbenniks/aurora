"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { MobileNavDrawer } from "@/components/mobile-nav-drawer"
import { MidnightSky } from "@/components/voxel/midnight-sky"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  if (pathname === "/login") {
    return (
      <div className="relative flex min-h-svh flex-col bg-background">
        <MidnightSky />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-background md:flex-row">
      <MidnightSky />
      <MobileHeader onOpenMenu={() => setMenuOpen(true)} />
      <AppSidebar />
      <MobileNavDrawer open={menuOpen} onOpenChange={setMenuOpen} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
