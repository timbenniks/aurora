import type { ValidationMessage, ValidationSummary } from "@/lib/aurora/types"
import { ValidationMessageList } from "@/components/launch/validation-message-list"
import { Panel } from "@/components/panel"
import { cn } from "@/lib/utils"

type ValidationResultsProps = {
  valid: boolean
  errors: ValidationMessage[]
  warnings: ValidationMessage[]
  summary?: ValidationSummary
}

function SummaryGrid({ summary }: { summary: ValidationSummary }) {
  return (
    <dl className="grid gap-3 text-lg sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Project</dt>
        <dd>{summary.projectName}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Repository</dt>
        <dd className="font-pixel">{summary.repoName}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Visibility</dt>
        <dd className="uppercase">{summary.visibility}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Type</dt>
        <dd>{summary.projectType.replaceAll("_", " ")}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Tasks</dt>
        <dd>{summary.taskCount}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Files</dt>
        <dd>{summary.fileCount}</dd>
      </div>
    </dl>
  )
}

export function ValidationResults({
  valid,
  errors,
  warnings,
  summary,
}: ValidationResultsProps) {
  return (
    <Panel interactive={false}>
      <h2 className="text-sm leading-relaxed">Validation result</h2>
      <p
        className={cn(
          "mt-3 text-xl",
          valid ? "text-success" : "text-destructive"
        )}
      >
        {valid ? "Valid — ready for preview." : "Invalid — fix the errors below."}
      </p>

      {summary ? (
        <div className="mt-4 border-t-2 border-border-subtle pt-4">
          <SummaryGrid summary={summary} />
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="mt-4 border-t-2 border-border-subtle pt-4">
          <h3 className="text-sm leading-relaxed text-destructive">Errors</h3>
          <ValidationMessageList className="mt-2" items={errors} tone="error" />
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mt-4 border-t-2 border-border-subtle pt-4">
          <h3 className="text-sm leading-relaxed text-warning">Warnings</h3>
          <ValidationMessageList
            className="mt-2"
            items={warnings}
            tone="warning"
          />
        </div>
      ) : null}
    </Panel>
  )
}
