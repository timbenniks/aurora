import { cn } from "@/lib/utils"
import {
  panelPaddingClass,
} from "@/lib/aurora/layout"
import {
  voxelPanelClass,
  voxelPanelInteractiveClass,
} from "@/lib/aurora/voxel"

type PanelProps = {
  children: React.ReactNode
  className?: string
  dashed?: boolean
  interactive?: boolean
}

export function Panel({
  children,
  className,
  dashed = false,
  interactive = true,
}: PanelProps) {
  return (
    <section
      className={cn(
        voxelPanelClass,
        panelPaddingClass,
        interactive && voxelPanelInteractiveClass,
        dashed && "border-dashed border-highlight/25 bg-card/80",
        className
      )}
    >
      {children}
    </section>
  )
}

type FeaturePanelProps = {
  title: string
  description: string
  children?: React.ReactNode
  className?: string
}

export function FeaturePanel({
  title,
  description,
  children,
  className,
}: FeaturePanelProps) {
  return (
    <Panel className={className}>
      <h2 className="text-sm leading-relaxed">{title}</h2>
      <p className="mt-3 max-w-2xl text-xl text-muted-foreground">
        {description}
      </p>
      {children}
    </Panel>
  )
}
