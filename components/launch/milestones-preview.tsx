import type { LaunchBrief } from "@/lib/aurora/types"
import { previewMetaClass } from "@/lib/aurora/voxel"
import { Panel } from "@/components/panel"

type MilestonesPreviewProps = {
  milestones: LaunchBrief["milestones"]
}

export function MilestonesPreview({ milestones }: MilestonesPreviewProps) {
  if (milestones.length === 0) {
    return (
      <p className="text-lg text-muted-foreground">No milestones defined.</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {milestones.map((milestone) => (
        <Panel key={milestone.id} interactive={false} className="p-4">
          <p className={previewMetaClass}>{milestone.id}</p>
          <h3 className="mt-1 text-base leading-relaxed">{milestone.title}</h3>
          <p className="mt-2 text-lg text-muted-foreground">
            {milestone.description}
          </p>
        </Panel>
      ))}
    </div>
  )
}
