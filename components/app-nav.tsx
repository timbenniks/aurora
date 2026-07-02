"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSyncExternalStore } from "react"

import { isNavItemActive, NAV_ITEMS } from "@/lib/navigation"
import {
  voxelIconClass,
  voxelNavItemActiveClass,
  voxelNavItemClass,
} from "@/lib/aurora/voxel"
import { cn } from "@/lib/utils"

type AppNavProps = {
  onNavigate?: () => void
}

export function AppNav({ onNavigate }: AppNavProps) {
  const pathname = usePathname()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  return (
    <nav className="flex flex-col gap-2 p-3">
      {NAV_ITEMS.map((item) => {
        const active =
          mounted && isNavItemActive(pathname, item.href, item.exact)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-2.5 px-3 py-2.5 transition-all duration-100 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none",
              active ? voxelNavItemActiveClass : voxelNavItemClass,
              !active && "hover:bg-accent"
            )}
          >
            <Icon className={cn("size-4", voxelIconClass)} strokeWidth={2.5} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
