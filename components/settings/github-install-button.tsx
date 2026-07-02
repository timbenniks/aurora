"use client"

import { ButtonLink } from "@/components/ui/button-link"
import { mobileCtaClass } from "@/lib/aurora/layout"

type GitHubInstallButtonProps = {
  installUrl: string
  connected: boolean
}

export function GitHubInstallButton({
  installUrl,
  connected,
}: GitHubInstallButtonProps) {
  return (
    <ButtonLink
      className={mobileCtaClass}
      href={installUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {connected ? "Manage GitHub App installation" : "Install Aurora GitHub App"}
    </ButtonLink>
  )
}
