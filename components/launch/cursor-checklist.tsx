import { ButtonLink } from "@/components/ui/button-link"
import { cn } from "@/lib/utils"

const CHECKLIST_ITEMS = [
  "Open the repository in Cursor.",
  "Enable GitHub integration.",
  "Enable Bugbot for this repository.",
  "Configure Approval Agents if available.",
  "Review BUGBOT.md.",
  "Review APPROVAL_POLICY.md.",
  "Open the first GitHub issue.",
  "Comment /agent build or use your Cursor Automation trigger.",
] as const

type CursorChecklistProps = {
  firstIssue?: {
    number: number
    title: string
    url: string
  }
  agentCommand: string
  className?: string
}

export function CursorChecklist({
  firstIssue,
  agentCommand,
  className,
}: CursorChecklistProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div>
        <h2 className="text-sm text-muted-foreground">Cursor setup</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-lg">
          {CHECKLIST_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>

      {firstIssue ? (
        <div className="border-t-2 border-[#1a2540] pt-4">
          <h3 className="text-sm text-muted-foreground">First recommended task</h3>
          <p className="mt-2 text-lg">
            Start with issue #{firstIssue.number}: {firstIssue.title}
          </p>
          <p className="mt-2 text-base text-muted-foreground">
            Suggested command: <code className="text-sm">{agentCommand}</code>
          </p>
          <ButtonLink className="mt-4" href={firstIssue.url} target="_blank">
            Open issue on GitHub
          </ButtonLink>
        </div>
      ) : null}
    </div>
  )
}
