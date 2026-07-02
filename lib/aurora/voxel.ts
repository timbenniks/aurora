import { cn } from "@/lib/utils"

import { auroraGradientClass } from "./classes"

/** Chunky Minecraft-style block shadow */
export const voxelShadowClass =
  "shadow-[4px_4px_0_0_#010204] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_#010204]"

export const voxelBorderClass =
  "rounded-none border-2 border-t-white/20 border-l-white/15 border-r-[#010204] border-b-[#010204]"

export const voxelPanelClass = cn(
  "rounded-none border-2 border-[#243049] bg-card",
  "shadow-[4px_4px_0_0_#010204,inset_0_0_0_1px_rgba(255,255,255,0.04)]"
)

export const voxelPanelInteractiveClass =
  "transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#010204]"

export const voxelNavItemTypographyClass =
  "font-pixel-heading text-[10px] leading-none uppercase tracking-wide"

export const voxelNavItemClass = cn(
  voxelBorderClass,
  voxelNavItemTypographyClass,
  "bg-secondary text-foreground shadow-[3px_3px_0_0_#010204]"
)

export const voxelNavItemActiveClass = cn(
  voxelBorderClass,
  voxelNavItemTypographyClass,
  auroraGradientClass,
  "border-t-white/30 border-l-white/25 text-[#020408]",
  "shadow-[3px_3px_0_0_#010204,0_0_12px_rgba(79,244,200,0.2)]"
)

export const voxelButtonPrimaryClass = cn(
  auroraGradientClass,
  voxelBorderClass,
  voxelShadowClass,
  voxelNavItemTypographyClass,
  "text-[#020408]",
  "hover:brightness-110"
)

export const voxelButtonOutlineClass = cn(
  voxelBorderClass,
  voxelShadowClass,
  voxelNavItemTypographyClass,
  "bg-secondary text-foreground",
  "hover:bg-[#1a2540]"
)

export const voxelHeadingClass = voxelNavItemTypographyClass

export const voxelIconClass =
  "shrink-0 [stroke-linecap:square] [stroke-linejoin:miter]"

/** Larger pixel type for tags, tabs, and metadata in preview panels */
export const previewChipClass = cn(
  voxelNavItemTypographyClass,
  "text-xs leading-snug"
)

export const previewMetaClass = cn(
  previewChipClass,
  "text-muted-foreground"
)

/** Body font for dense paths and code-like lists */
export const previewPathClass = "text-lg leading-snug break-all"
