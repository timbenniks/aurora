import { cn } from "@/lib/utils"

type PrStatusBadgesProps = {
  ciStatus?: string | null
  bugbotStatus?: string | null
  approvalStatus?: string | null
  humanReviewRequired?: boolean | null
  className?: string
}

function badgeClass(tone: "success" | "warning" | "muted" | "destructive") {
  switch (tone) {
    case "success":
      return "border-success/40 bg-success/10 text-success"
    case "warning":
      return "border-warning/40 bg-warning/10 text-warning"
    case "destructive":
      return "border-destructive/40 bg-destructive/10 text-destructive"
    default:
      return "border-[#243049] bg-[#0c1220] text-muted-foreground"
  }
}

function Badge({
  label,
  tone,
}: {
  label: string
  tone: "success" | "warning" | "muted" | "destructive"
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-xs uppercase tracking-wide",
        badgeClass(tone)
      )}
    >
      {label}
    </span>
  )
}

export function PrStatusBadges({
  ciStatus,
  bugbotStatus,
  approvalStatus,
  humanReviewRequired,
  className,
}: PrStatusBadgesProps) {
  const badges: Array<{ label: string; tone: "success" | "warning" | "muted" | "destructive" }> =
    []

  if (ciStatus === "success") {
    badges.push({ label: "CI pass", tone: "success" })
  } else if (ciStatus === "failure" || ciStatus === "cancelled") {
    badges.push({ label: "CI fail", tone: "destructive" })
  } else if (ciStatus === "pending") {
    badges.push({ label: "CI pending", tone: "warning" })
  }

  if (bugbotStatus === "clean") {
    badges.push({ label: "Bugbot clean", tone: "success" })
  } else if (bugbotStatus === "failed") {
    badges.push({ label: "Bugbot fail", tone: "destructive" })
  }

  if (approvalStatus === "approved") {
    badges.push({ label: "Approved", tone: "success" })
  } else if (approvalStatus === "changes_requested") {
    badges.push({ label: "Changes requested", tone: "warning" })
  }

  if (humanReviewRequired) {
    badges.push({ label: "Human review", tone: "warning" })
  }

  if (badges.length === 0) {
    badges.push({ label: "Status pending", tone: "muted" })
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => (
        <Badge key={badge.label} label={badge.label} tone={badge.tone} />
      ))}
    </div>
  )
}
