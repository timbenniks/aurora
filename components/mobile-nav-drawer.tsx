"use client"

import { useEffect, useRef } from "react"

import { AppNav } from "@/components/app-nav"
import { AppSidebarBrand } from "@/components/app-sidebar-brand"
import { ButtonLink } from "@/components/ui/button-link"
import { cn } from "@/lib/utils"

type MobileNavDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNavDrawer({ open, onOpenChange }: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onOpenChange])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <button
        type="button"
        aria-label="Close navigation menu"
        className="absolute inset-0 bg-[#010204]/80"
        onClick={() => onOpenChange(false)}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "relative flex h-full w-[min(100%,18rem)] flex-col border-r-2 border-[#1a2540]",
          "bg-[#060a14] shadow-[4px_0_0_0_#010204] outline-none"
        )}
      >
        <div className="border-b-2 border-[#1a2540] px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <AppSidebarBrand onNavigate={() => onOpenChange(false)} />
        </div>
        <AppNav onNavigate={() => onOpenChange(false)} />
        <div className="mt-auto border-t-2 border-[#1a2540] p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <ButtonLink
            className="w-full justify-center text-[10px]"
            href="/settings"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            GitHub account
          </ButtonLink>
        </div>
      </aside>
    </div>
  )
}
