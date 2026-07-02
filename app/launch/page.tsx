import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { FeaturePanel } from "@/components/panel"
import { ButtonLink } from "@/components/ui/button-link"

export default function LaunchPage() {
  return (
    <PageFrame>
      <PageHeader
        title="Launch"
        description="Turn a validated launch brief into an agent-ready GitHub workspace."
      />

      <FeaturePanel
        title="Create new project"
        description="Shape your idea with an LLM, validate the launch brief, review the generated output, and create a fresh GitHub repository."
      >
        <ButtonLink className="mt-4" href="/launch/new/brief">
          Start new project
        </ButtonLink>
      </FeaturePanel>

      <FeaturePanel
        title="Prepare existing repo"
        description="Add Aurora setup files to a repository you already own via a setup pull request. Uses a validated launch brief to generate the missing files."
      >
        <ButtonLink
          className="mt-4"
          variant="outline"
          href="/launch/prepare-existing"
        >
          Prepare existing repo
        </ButtonLink>
      </FeaturePanel>
    </PageFrame>
  )
}
