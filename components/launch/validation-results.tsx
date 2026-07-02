import type { ValidationMessage, ValidationSummary } from "@/lib/aurora/types"
import { Panel } from "@/components/panel"
import { cn } from "@/lib/utils"

type ValidationResultsProps = {
  valid: boolean
  errors: ValidationMessage[]
  warnings: ValidationMessage[]
  summary?: ValidationSummary
}

function MessageList({
  items,
  tone,
}: {
  items: ValidationMessage[]
  tone: "error" | "warning"
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul
      className={cn(
        "flex flex-col gap-2 text-lg",
        tone === "error" ? "text-destructive" : "text-warning"
      )}
    >
      {items.map((item, index) => (
        <li key={`${item.code}-${item.path}-${index}`}>
          {item.path ? (
            <span className="font-pixel text-base text-muted-foreground">
              {item.path}:{" "}
            </span>
          ) : null}
          {item.message}
        </li>
      ))}
    </ul>
  )
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
        <div className="mt-4 border-t-2 border-[#1a2540] pt-4">
          <SummaryGrid summary={summary} />
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="mt-4 border-t-2 border-[#1a2540] pt-4">
          <h3 className="text-sm leading-relaxed text-destructive">Errors</h3>
          <div className="mt-2">
            <MessageList items={errors} tone="error" />
          </div>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mt-4 border-t-2 border-[#1a2540] pt-4">
          <h3 className="text-sm leading-relaxed text-warning">Warnings</h3>
          <div className="mt-2">
            <MessageList items={warnings} tone="warning" />
          </div>
        </div>
      ) : null}
    </Panel>
  )
}
