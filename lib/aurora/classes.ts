import { cn } from "@/lib/utils"

/** Shared Aurora gradient class strings for Tailwind compilation. */

export const auroraGradientClass =
  "bg-gradient-to-r from-[#4ef4c8] via-[#31c9ff] via-[#7d6bff] to-[#c44dff]"

export const auroraGradientTextClass = cn(
  auroraGradientClass,
  "bg-clip-text text-transparent"
)
