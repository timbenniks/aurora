import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { LaunchStepper } from "@/components/launch/launch-stepper"
import { GitHubConnectionPanel } from "@/components/settings/github-connection"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { ButtonLink } from "@/components/ui/button-link"

export default async function LaunchConnectPage() {
  const session = await auth()
  const connected =
    Boolean(session?.user) && Boolean(session?.githubInstallationId)

  if (connected) {
    redirect("/launch/new/create")
  }

  return (
    <PageFrame>
      <PageHeader
        title="Connect GitHub"
        description="Aurora needs your GitHub sign-in and the Aurora GitHub App installation to create repositories on your account."
      />

      <LaunchStepper current="connect" />

      <GitHubConnectionPanel />

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink variant="outline" href="/launch/new/review">
          Back to Review
        </ButtonLink>
        <ButtonLink href="/launch/new/create">Continue to Create</ButtonLink>
      </div>
    </PageFrame>
  )
}
