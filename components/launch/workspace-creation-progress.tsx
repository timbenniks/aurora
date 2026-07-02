"use client"

import { cn } from "@/lib/utils"
import type { CreationProgressStep } from "@/lib/launch/run-workspace-creation"

type WorkspaceCreationProgressProps = {
  steps: CreationProgressStep[]
  className?: string
}

function statusSymbol(status: CreationProgressStep["status"]): string {
  switch (status) {
    case "done":
      return "✓"
    case "running":
      return "…"
    case "error":
      return "!"
    case "skipped":
      return "–"
    default:
      return "○"
  }
}

export function WorkspaceCreationProgress({
  steps,
  className,
}: WorkspaceCreationProgressProps) {
  return (
    <ol className={cn("flex flex-col gap-3", className)} aria-live="polite">
      {steps.map((step) => (
        <li
          key={step.id}
          className={cn(
            "border-l-2 py-1 pl-4",
            step.status === "running" && "border-primary",
            step.status === "done" && "border-success",
            step.status === "error" && "border-destructive",
            step.status === "pending" && "border-[#1a2540]",
            step.status === "skipped" && "border-muted-foreground"
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 w-4 shrink-0 font-pixel text-sm",
                step.status === "running" && "text-primary",
                step.status === "done" && "text-success",
                step.status === "error" && "text-destructive",
                step.status === "pending" && "text-muted-foreground"
              )}
              aria-hidden
            >
              {statusSymbol(step.status)}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-lg",
                  step.status === "pending" && "text-muted-foreground",
                  step.status === "running" && "text-foreground",
                  step.status === "done" && "text-foreground",
                  step.status === "error" && "text-destructive"
                )}
              >
                {step.label}
                {step.status === "running" ? "…" : null}
              </p>
              {step.detail ? (
                <p className="text-base text-muted-foreground">{step.detail}</p>
              ) : null}
              {step.error ? (
                <p className="mt-1 text-base text-destructive">{step.error}</p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
