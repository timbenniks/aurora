"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useSyncExternalStore } from "react"

import { EmptyState } from "@/components/empty-state"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { mobileCtaClass } from "@/lib/aurora/layout"
import {
  getActiveLaunchBriefSnapshot,
  subscribeToLaunchBriefDraft,
} from "@/lib/launch/brief-storage"
import { cn } from "@/lib/utils"

type InstallationRepository = {
  id: number
  owner: string
  name: string
  fullName: string
  url: string
  defaultBranch: string
  private: boolean
  isLinked: boolean
}

type ScanResult = {
  existingPaths: string[]
  missingPaths: string[]
  readiness: { score: number }
}

export function PrepareExistingRoom() {
  const router = useRouter()
  const briefJson = useSyncExternalStore(
    subscribeToLaunchBriefDraft,
    getActiveLaunchBriefSnapshot,
    () => ""
  )
  const [repositories, setRepositories] = useState<InstallationRepository[]>(
    []
  )
  const [selectedRepo, setSelectedRepo] = useState<InstallationRepository | null>(
    null
  )
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [isLoadingRepos, setIsLoadingRepos] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadRepositories() {
      setIsLoadingRepos(true)
      setError(null)

      try {
        const response = await fetch("/api/github/repositories")

        if (!response.ok) {
          const data = (await response.json()) as { error?: string }
          setError(data.error ?? "Could not load repositories.")
          return
        }

        const data = (await response.json()) as {
          repositories: InstallationRepository[]
        }

        setRepositories(data.repositories)
      } catch {
        setError("Could not load repositories.")
      } finally {
        setIsLoadingRepos(false)
      }
    }

    void loadRepositories()
  }, [])

  async function handleSelectRepo(repository: InstallationRepository) {
    setSelectedRepo(repository)
    setScan(null)
    setMessage(null)
    setError(null)
    setIsScanning(true)

    try {
      const response = await fetch("/api/github/repositories/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repository.owner,
          repo: repository.name,
          defaultBranch: repository.defaultBranch,
        }),
      })

      const data = (await response.json()) as {
        error?: string
        scan?: ScanResult
      }

      if (!response.ok) {
        setError(data.error ?? "Could not scan repository.")
        return
      }

      setScan(data.scan ?? null)
    } catch {
      setError("Could not scan repository.")
    } finally {
      setIsScanning(false)
    }
  }

  async function handlePrepare() {
    if (!selectedRepo || !briefJson?.trim()) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    let launchBrief: unknown

    try {
      launchBrief = JSON.parse(briefJson)
    } catch {
      setError("Launch brief is not valid JSON.")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/workspaces/prepare-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          launch_brief: launchBrief,
          owner: selectedRepo.owner,
          repo: selectedRepo.name,
        }),
      })

      const data = (await response.json()) as {
        error?: string
        workspaceId?: string
        pullRequest?: { url: string; number: number }
        filesInPullRequest?: string[]
        alreadyLinked?: boolean
      }

      if (!response.ok) {
        setError(data.error ?? "Could not prepare repository.")
        return
      }

      if (data.pullRequest) {
        setMessage(
          `Setup PR #${data.pullRequest.number} opened with ${data.filesInPullRequest?.length ?? 0} files.`
        )
      } else {
        setMessage("Repository is already fully set up. Linked to Aurora.")
      }

      if (data.workspaceId) {
        router.push(`/workspaces/${data.workspaceId}`)
      }
    } catch {
      setError("Could not prepare repository.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!briefJson?.trim()) {
    return (
      <PageFrame>
        <PageHeader
          title="Prepare existing repo"
          description="Add Aurora setup files to a repository you already own."
        />
        <EmptyState
          title="Validate a launch brief first"
          description="Aurora uses your launch brief to generate missing workflow files for the setup pull request."
          action={
            <ButtonLink className="mt-6" href="/launch">
              Go to Launch room
            </ButtonLink>
          }
        />
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Prepare existing repo"
        description="Select a repository, review missing Aurora files, and open a setup pull request."
        action={
          <ButtonLink variant="outline" href="/launch">
            Back to Launch room
          </ButtonLink>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel interactive={false}>
          <h2 className="text-sm text-muted-foreground">Select repository</h2>

          {isLoadingRepos ? (
            <p className="mt-4 text-base text-muted-foreground">
              Loading repositories…
            </p>
          ) : repositories.length === 0 ? (
            <p className="mt-4 text-base text-muted-foreground">
              No repositories found for your GitHub App installation.
            </p>
          ) : (
            <ul className="mt-4 flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
              {repositories.map((repository) => {
                const isSelected = selectedRepo?.id === repository.id

                return (
                  <li key={repository.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full border-2 px-4 py-3 text-left transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-[#1a2540] hover:border-primary/40"
                      )}
                      onClick={() => handleSelectRepo(repository)}
                    >
                      <span className="block text-lg">{repository.fullName}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {repository.private ? "Private" : "Public"}
                        {repository.isLinked ? " · Already in Aurora" : ""}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel interactive={false}>
          <h2 className="text-sm text-muted-foreground">Scan results</h2>

          {!selectedRepo ? (
            <p className="mt-4 text-base text-muted-foreground">
              Select a repository to scan for Aurora setup files.
            </p>
          ) : isScanning ? (
            <p className="mt-4 text-base text-muted-foreground">Scanning…</p>
          ) : scan ? (
            <div className="mt-4 flex flex-col gap-4">
              <p className="text-lg">
                Readiness on <strong>{selectedRepo.defaultBranch}</strong>:{" "}
                <span className="text-primary">{scan.readiness.score}/100</span>
              </p>

              {scan.existingPaths.length > 0 ? (
                <div>
                  <h3 className="text-sm text-muted-foreground">Already present</h3>
                  <ul className="mt-2 flex flex-col gap-1 text-base">
                    {scan.existingPaths.map((path) => (
                      <li key={path} className="text-success">
                        ✓ {path}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {scan.missingPaths.length > 0 ? (
                <div>
                  <h3 className="text-sm text-muted-foreground">Will add in PR</h3>
                  <ul className="mt-2 flex flex-col gap-1 text-base">
                    {scan.missingPaths.map((path) => (
                      <li key={path} className="text-muted-foreground">
                        ○ {path}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-base text-muted-foreground">
                  All Aurora setup files are already on the default branch.
                </p>
              )}

              <Button
                className={mobileCtaClass}
                type="button"
                disabled={isSubmitting}
                onClick={handlePrepare}
              >
                {isSubmitting
                  ? "Working on GitHub…"
                  : scan.missingPaths.length > 0
                    ? "Open setup pull request"
                    : "Link workspace"}
              </Button>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-base text-destructive">{error}</p>
          ) : null}

          {message ? (
            <p className="mt-4 text-base text-muted-foreground">{message}</p>
          ) : null}
        </Panel>
      </div>
    </PageFrame>
  )
}
