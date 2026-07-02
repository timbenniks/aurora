import { previewChipClass } from "@/lib/aurora/voxel"
import { Panel } from "@/components/panel"
import { cn } from "@/lib/utils"

type LabelsPreviewProps = {
  labels: string[]
}

export function LabelsPreview({ labels }: LabelsPreviewProps) {
  if (labels.length === 0) {
    return (
      <p className="text-lg text-muted-foreground">No labels configured.</p>
    )
  }

  return (
    <Panel interactive={false} className="p-4">
      <p className="text-lg text-muted-foreground">
        Aurora creates these GitHub labels in every new repository.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {labels.map((label) => (
          <li
            key={label}
            className={cn(
              previewChipClass,
              "border-2 border-border bg-input px-3 py-2 text-foreground shadow-[2px_2px_0_0_var(--voxel-shadow)]"
            )}
          >
            {label}
          </li>
        ))}
      </ul>
    </Panel>
  )
}
