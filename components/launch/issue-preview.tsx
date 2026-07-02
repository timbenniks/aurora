import type { GeneratedIssue } from "@/lib/aurora/types"
import { previewChipClass, previewMetaClass } from "@/lib/aurora/voxel"
import { Panel } from "@/components/panel"
import { cn } from "@/lib/utils"

type IssuePreviewProps = {
  issues: GeneratedIssue[]
}

export function IssuePreview({ issues }: IssuePreviewProps) {
  if (issues.length === 0) {
    return (
      <p className="text-lg text-muted-foreground">No issues generated.</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {issues.map((issue) => (
        <Panel key={issue.taskId} interactive={false} className="p-4">
          <details>
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base leading-relaxed">{issue.title}</h3>
                {issue.milestone ? (
                  <span className={previewMetaClass}>{issue.milestone}</span>
                ) : null}
              </div>
              {issue.labels.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {issue.labels.map((label) => (
                    <span
                      key={label}
                      className={cn(
                        previewChipClass,
                        "border border-border bg-input px-2.5 py-1 text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </summary>
            <pre className="mt-4 max-h-80 overflow-auto border-2 border-border bg-input p-4 text-sm whitespace-pre-wrap text-foreground">
              {issue.body}
            </pre>
          </details>
        </Panel>
      ))}
    </div>
  )
}
