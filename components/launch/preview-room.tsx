"use client"

import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { FilePreview } from "@/components/launch/file-preview"
import { IssuePreview } from "@/components/launch/issue-preview"
import { LabelsPreview } from "@/components/launch/labels-preview"
import { MilestonesPreview } from "@/components/launch/milestones-preview"
import {
  PreviewTabs,
  type PreviewTab,
} from "@/components/launch/preview-tabs"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { CreateRepositoryButton } from "@/components/launch/create-repository-button"
import { ButtonLink } from "@/components/ui/button-link"
import type { ValidationMessage } from "@/lib/aurora/types"
import {
  mobileCtaClass,
  mobileStickyFooterClass,
  mobileStickyFooterSpacerClass,
} from "@/lib/aurora/layout"
import { loadLaunchBriefDraft } from "@/lib/launch/brief-storage"
import {
  fetchLaunchPreview,
  type LaunchPreviewData,
} from "@/lib/launch/fetch-launch-preview"
import { cn } from "@/lib/utils"

function ValidationMessageList({
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
        "mt-3 flex flex-col gap-2 text-lg",
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

export function PreviewRoom() {
  const [preview, setPreview] = useState<LaunchPreviewData | null>(null)
  const [errors, setErrors] = useState<ValidationMessage[]>([])
  const [warnings, setWarnings] = useState<ValidationMessage[]>([])
  const [activeTab, setActiveTab] = useState<PreviewTab>("files")
  const [isLoading, setIsLoading] = useState(true)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [missingDraft, setMissingDraft] = useState(false)

  useEffect(() => {
    async function loadPreview() {
      const draft = loadLaunchBriefDraft()

      if (!draft?.trim()) {
        setMissingDraft(true)
        setIsLoading(false)
        return
      }

      let parsedJson: unknown

      try {
        parsedJson = JSON.parse(draft)
      } catch {
        setErrors([
          {
            code: "invalid_json",
            message: "Launch brief is not valid JSON.",
            path: "",
          },
        ])
        setIsLoading(false)
        return
      }

      try {
        const result = await fetchLaunchPreview(parsedJson)

        if (!result.valid) {
          setErrors(result.errors)
          setWarnings(result.warnings)
          setIsLoading(false)
          return
        }

        setPreview(result)
        setWarnings(result.warnings)
      } catch {
        setRequestError("Could not load preview. Try again.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadPreview()
  }, [])

  if (isLoading) {
    return (
      <PageFrame>
        <PageHeader
          title="Preview"
          description="Loading generated files, issues, labels, and milestones."
        />
        <Panel interactive={false}>
          <p className="text-xl text-muted-foreground">Generating preview…</p>
        </Panel>
      </PageFrame>
    )
  }

  if (missingDraft) {
    return (
      <PageFrame>
        <PageHeader title="Preview" description="Nothing to preview yet." />
        <EmptyState
          title="No launch brief found"
          description="Validate a launch brief in the Launch room first, then return here to preview what Aurora will create."
          action={
            <ButtonLink className="mt-6" href="/launch">
              Go to Launch room
            </ButtonLink>
          }
        />
      </PageFrame>
    )
  }

  if (requestError) {
    return (
      <PageFrame>
        <PageHeader title="Preview" description="Preview failed to load." />
        <Panel interactive={false}>
          <p className="text-lg text-destructive">{requestError}</p>
          <ButtonLink className="mt-4" variant="outline" href="/launch">
            Back to Launch room
          </ButtonLink>
        </Panel>
      </PageFrame>
    )
  }

  if (!preview) {
    return (
      <PageFrame>
        <PageHeader
          title="Preview"
          description="Fix validation errors before previewing."
          action={
            <ButtonLink variant="outline" href="/launch">
              Back to Launch room
            </ButtonLink>
          }
        />
        <Panel interactive={false}>
          <h2 className="text-sm leading-relaxed text-destructive">
            Brief is not valid
          </h2>
          <ValidationMessageList items={errors} tone="error" />
          <ValidationMessageList items={warnings} tone="warning" />
          <ButtonLink className="mt-4" href="/launch">
            Edit launch brief
          </ButtonLink>
        </Panel>
      </PageFrame>
    )
  }

  const tabCounts: Record<PreviewTab, number> = {
    files: preview.files.length,
    issues: preview.issues.length,
    labels: preview.labels.length,
    milestones: preview.milestones.length,
  }

  return (
    <>
      <PageFrame>
        <PageHeader
          title="Preview"
          description={`${preview.summary.projectName} — review generated output before creating the GitHub repository.`}
          action={
            <div className="hidden flex-col gap-3 md:flex">
              <ButtonLink variant="outline" href="/launch">
                Back to Launch room
              </ButtonLink>
              <CreateRepositoryButton />
            </div>
          }
        />

        {warnings.length > 0 ? (
          <Panel interactive={false} className="mb-4 border-warning/40">
            <h2 className="text-sm leading-relaxed text-warning">Warnings</h2>
            <ValidationMessageList items={warnings} tone="warning" />
          </Panel>
        ) : null}

        <Panel interactive={false}>
          <PreviewTabs
            active={activeTab}
            onChange={setActiveTab}
            counts={tabCounts}
          />

          <div className="mt-6" role="tabpanel">
            {activeTab === "files" ? <FilePreview files={preview.files} /> : null}
            {activeTab === "issues" ? (
              <IssuePreview issues={preview.issues} />
            ) : null}
            {activeTab === "labels" ? (
              <LabelsPreview labels={preview.labels} />
            ) : null}
            {activeTab === "milestones" ? (
              <MilestonesPreview milestones={preview.milestones} />
            ) : null}
          </div>
        </Panel>

        <div className={mobileStickyFooterSpacerClass} aria-hidden />
      </PageFrame>

      <div className={mobileStickyFooterClass}>
        <ButtonLink className={mobileCtaClass} variant="outline" href="/launch">
          Back to Launch room
        </ButtonLink>
        <CreateRepositoryButton />
      </div>
    </>
  )
}
