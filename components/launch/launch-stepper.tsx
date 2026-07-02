"use client"

import Link from "next/link"

import { useLaunchBrief } from "@/lib/launch/use-launch-brief"
import { previewChipClass } from "@/lib/aurora/voxel"
import { cn } from "@/lib/utils"

export type LaunchStepId = "brief" | "review" | "connect" | "create"

const STEPS: { id: LaunchStepId; label: string; href: string }[] = [
  { id: "brief", label: "Brief", href: "/launch/new/brief" },
  { id: "review", label: "Review", href: "/launch/new/review" },
  { id: "connect", label: "Connect", href: "/launch/new/connect" },
  { id: "create", label: "Create", href: "/launch/new/create" },
]

type LaunchStepperProps = {
  current: LaunchStepId
  className?: string
}

/**
 * Wizard progress for the create-new-project flow. Steps after "Brief" stay
 * locked until the current draft has passed validation.
 */
export function LaunchStepper({ current, className }: LaunchStepperProps) {
  const { isValidated } = useLaunchBrief()
  const currentIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <nav aria-label="Launch steps" className={className}>
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((step, index) => {
          const isCurrent = step.id === current
          const isDone = isValidated && index < currentIndex
          const isLocked = step.id !== "brief" && !isValidated

          const chipClass = cn(
            "flex min-h-11 items-center gap-2 border-2 px-4 py-2.5",
            previewChipClass,
            isCurrent
              ? "border-highlight bg-card text-primary shadow-[3px_3px_0_0_var(--voxel-shadow)]"
              : isDone
                ? "border-success/40 bg-secondary text-success shadow-[3px_3px_0_0_var(--voxel-shadow)]"
                : "border-border bg-secondary text-muted-foreground shadow-[3px_3px_0_0_var(--voxel-shadow)]"
          )

          const content = (
            <>
              <span aria-hidden>{isDone ? "✓" : index + 1}</span>
              {step.label}
            </>
          )

          return (
            <li key={step.id}>
              {isLocked || isCurrent ? (
                <span
                  className={chipClass}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-disabled={isLocked || undefined}
                >
                  {content}
                </span>
              ) : (
                <Link className={cn(chipClass, "hover:text-foreground")} href={step.href}>
                  {content}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
