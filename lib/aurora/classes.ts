import { cn } from "@/lib/utils"

/** Shared Aurora gradient class strings for Tailwind compilation. */

export const auroraGradientClass =
  "bg-gradient-to-r from-primary via-highlight via-chart-3 to-chart-4"

export const auroraGradientTextClass = cn(
  auroraGradientClass,
  "bg-clip-text text-transparent"
)
