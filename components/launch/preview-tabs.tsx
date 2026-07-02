"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"
import { previewChipClass } from "@/lib/aurora/voxel"

export type PreviewTab = "files" | "issues" | "labels" | "milestones"

const TABS: { id: PreviewTab; label: string }[] = [
  { id: "files", label: "Files" },
  { id: "issues", label: "Issues" },
  { id: "labels", label: "Labels" },
  { id: "milestones", label: "Milestones" },
]

type PreviewTabsProps = {
  active: PreviewTab
  onChange: (tab: PreviewTab) => void
  counts: Record<PreviewTab, number>
}

export function PreviewTabs({ active, onChange, counts }: PreviewTabsProps) {
  const tabRefs = useRef(new Map<PreviewTab, HTMLButtonElement>())

  function focusTab(id: PreviewTab) {
    onChange(id)
    tabRefs.current.get(id)?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const currentIndex = TABS.findIndex((tab) => tab.id === active)

    if (event.key === "ArrowRight") {
      event.preventDefault()
      focusTab(TABS[(currentIndex + 1) % TABS.length].id)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      focusTab(TABS[(currentIndex - 1 + TABS.length) % TABS.length].id)
    } else if (event.key === "Home") {
      event.preventDefault()
      focusTab(TABS[0].id)
    } else if (event.key === "End") {
      event.preventDefault()
      focusTab(TABS[TABS.length - 1].id)
    }
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Preview"
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab) => {
        const selected = active === tab.id

        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) {
                tabRefs.current.set(tab.id, node)
              } else {
                tabRefs.current.delete(tab.id)
              }
            }}
            type="button"
            role="tab"
            id={`preview-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`preview-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "min-h-11 shrink-0 snap-start border-2 px-4 py-2.5 transition-colors",
              previewChipClass,
              selected
                ? "border-highlight bg-card text-primary shadow-[3px_3px_0_0_var(--voxel-shadow)]"
                : "border-border bg-secondary text-foreground shadow-[3px_3px_0_0_var(--voxel-shadow)] hover:bg-accent"
            )}
          >
            {tab.label}
            <span className="ml-2 text-muted-foreground">({counts[tab.id]})</span>
          </button>
        )
      })}
    </div>
  )
}
