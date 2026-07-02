"use client"

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
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Preview"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "min-h-11 shrink-0 snap-start border-2 px-4 py-2.5 transition-colors",
              previewChipClass,
              selected
                ? "border-[#31c9ff] bg-[#0c1220] text-[#4ff4c8] shadow-[3px_3px_0_0_#010204]"
                : "border-[#243049] bg-secondary text-foreground shadow-[3px_3px_0_0_#010204] hover:bg-[#121a2c]"
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
