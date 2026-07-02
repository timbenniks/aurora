import { EmptyState } from "@/components/empty-state"
import { ButtonLink } from "@/components/ui/button-link"

export function EmptyWorkspaces() {
  return (
    <EmptyState
      title="No workspaces yet"
      description="Create a project from a launch brief and Aurora will bootstrap a GitHub repo with agent-ready issues."
      action={
        <ButtonLink className="mt-6" href="/launch">
          Create your first project
        </ButtonLink>
      }
    />
  )
}
