import { Suspense } from "react"

import { auth } from "@/auth"
import { SignInButton, SignOutButton } from "@/components/auth/auth-buttons"
import { GitHubInstallButton } from "@/components/settings/github-install-button"
import { GitHubInstallationLinker } from "@/components/settings/github-installation-linker"
import { FeaturePanel } from "@/components/panel"
import { SummaryRow } from "@/components/summary-row"
import { isGitHubAppConfigured } from "@/lib/github/env"
import { getGitHubAppInstallUrl } from "@/lib/github/installation"

export async function GitHubConnectionPanel() {
  const session = await auth()
  const signedIn = Boolean(session?.user)
  const appConfigured = isGitHubAppConfigured()
  const installationConnected = Boolean(session?.githubInstallationId)
  const installUrl = appConfigured ? getGitHubAppInstallUrl() : ""

  return (
    <FeaturePanel
      title="GitHub"
      description="Sign in with GitHub and install the Aurora GitHub App to create repositories and bootstrap agent-ready project files."
    >
      <dl className="mt-4">
        <SummaryRow
          label="Signed in"
          value={
            signedIn
              ? `@${session?.githubLogin ?? session?.user?.name ?? "github-user"}`
              : "Not signed in"
          }
          valueClassName={signedIn ? "text-success" : "text-muted-foreground"}
        />
        <SummaryRow
          label="GitHub App"
          value={
            installationConnected
              ? `Installation #${session?.githubInstallationId}`
              : appConfigured
                ? "Not installed"
                : "Missing GITHUB_APP_SLUG or app credentials"
          }
          valueClassName={
            installationConnected ? "text-success" : "text-muted-foreground"
          }
        />
      </dl>

      <Suspense fallback={null}>
        <GitHubInstallationLinker />
      </Suspense>

      <div className="mt-6 flex flex-col gap-3">
        {!signedIn ? <SignInButton /> : <SignOutButton />}

        {signedIn && appConfigured ? (
          <GitHubInstallButton
            connected={installationConnected}
            installUrl={installUrl}
          />
        ) : null}

        {signedIn && installationConnected ? (
          <p className="text-lg text-muted-foreground">
            Signed in and connected. You can validate launch briefs, preview
            output, and create repositories.
          </p>
        ) : null}

        {signedIn && !installationConnected && appConfigured ? (
          <p className="text-lg text-muted-foreground">
            Install the Aurora GitHub App to create repositories on your
            account.
          </p>
        ) : null}

        {signedIn ? (
          <p className="text-base text-muted-foreground">
            If repository creation fails with a permissions error, sign out and
            sign in again so Aurora can request the <code className="text-sm">repo</code>{" "}
            scope.
          </p>
        ) : null}

        {!appConfigured ? (
          <p className="text-lg text-warning">
            Add GITHUB_APP_SLUG and app credentials to .env.local to enable
            installation.
          </p>
        ) : null}
      </div>
    </FeaturePanel>
  )
}
