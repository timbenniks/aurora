"use client"

import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { FilePreview } from "@/components/launch/file-preview"
import { IssuePreview } from "@/components/launch/issue-preview"
import { LabelsPreview } from "@/components/launch/labels-preview"
import { LaunchStepper } from "@/components/launch/launch-stepper"
import { MilestonesPreview } from "@/components/launch/milestones-preview"
import {
  PreviewTabs,
  type PreviewTab,
} from "@/components/launch/preview-tabs"
import { ValidationMessageList } from "@/components/launch/validation-message-list"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { ButtonLink } from "@/components/ui/button-link"
import type { ValidationMessage } from "@/lib/aurora/types"
import {
  mobileCtaClass,
  mobileStickyFooterClass,
  mobileStickyFooterSpacerClass,
} from "@/lib/aurora/layout"
import {
  isLaunchBriefValidated,
  loadLaunchBriefDraft,
} from "@/lib/launch/brief-storage"
import { useLaunchBrief } from "@/lib/launch/use-launch-brief"
import {
  fetchLaunchPreview,
  type LaunchPreviewData,
} from "@/lib/launch/fetch-launch-preview"

function ReviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <PageFrame>
      <PageHeader
        title="Review"
        description="Check the generated files, issues, labels, and milestones before anything touches GitHub."
      />
      <LaunchStepper current="review" />
      {children}
    </PageFrame>
  )
}

export function ReviewStep() {
  const { briefJson, isValidated } = useLaunchBrief()
  const [preview, setPreview] = useState<LaunchPreviewData | null>(null)
  const [errors, setErrors] = useState<ValidationMessage[]>([])
  const [warnings, setWarnings] = useState<ValidationMessage[]>([])
  const [activeTab, setActiveTab] = useState<PreviewTab>("files")
  const [isLoading, setIsLoading] = useState(true)
  const [requestError, setRequestError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPreview() {
      // Read storage directly: the closed-over hook values are still the
      // server snapshot when this mount effect runs during hydration.
      const draft = loadLaunchBriefDraft()

      if (!draft?.trim() || !isLaunchBriefValidated()) {
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
      <ReviewFrame>
        <Panel interactive={false}>
          <p className="text-xl text-muted-foreground">Generating preview…</p>
        </Panel>
      </ReviewFrame>
    )
  }

  if (!briefJson.trim() || !isValidated) {
    return (
      <ReviewFrame>
        <EmptyState
          title="No validated launch brief"
          description="Validate a launch brief in the Brief step first, then return here to review what Aurora will create."
          action={
            <ButtonLink className="mt-6" href="/launch/new/brief">
              Go to Brief step
            </ButtonLink>
          }
        />
      </ReviewFrame>
    )
  }

  if (requestError) {
    return (
      <ReviewFrame>
        <Panel interactive={false}>
          <p className="text-lg text-destructive">{requestError}</p>
          <ButtonLink className="mt-4" variant="outline" href="/launch/new/brief">
            Back to Brief step
          </ButtonLink>
        </Panel>
      </ReviewFrame>
    )
  }

  if (!preview) {
    return (
      <ReviewFrame>
        <Panel interactive={false}>
          <h2 className="text-sm leading-relaxed text-destructive">
            Brief is not valid
          </h2>
          <ValidationMessageList className="mt-3" items={errors} tone="error" />
          <ValidationMessageList
            className="mt-3"
            items={warnings}
            tone="warning"
          />
          <ButtonLink className="mt-4" href="/launch/new/brief">
            Edit launch brief
          </ButtonLink>
        </Panel>
      </ReviewFrame>
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
          title="Review"
          description={`${preview.summary.projectName} — review generated output before creating the GitHub repository.`}
          action={
            <div className="hidden flex-col gap-3 md:flex">
              <ButtonLink variant="outline" href="/launch/new/brief">
                Back to Brief
              </ButtonLink>
              <ButtonLink href="/launch/new/connect">
                Continue to Connect
              </ButtonLink>
            </div>
          }
        />

        <LaunchStepper current="review" />

        {warnings.length > 0 ? (
          <Panel interactive={false} className="mb-4 border-warning/40">
            <h2 className="text-sm leading-relaxed text-warning">Warnings</h2>
            <ValidationMessageList
              className="mt-3"
              items={warnings}
              tone="warning"
            />
          </Panel>
        ) : null}

        <Panel interactive={false}>
          <PreviewTabs
            active={activeTab}
            onChange={setActiveTab}
            counts={tabCounts}
          />

          <div
            className="mt-6"
            role="tabpanel"
            id={`preview-panel-${activeTab}`}
            aria-labelledby={`preview-tab-${activeTab}`}
          >
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
        <ButtonLink
          className={mobileCtaClass}
          variant="outline"
          href="/launch/new/brief"
        >
          Back to Brief
        </ButtonLink>
        <ButtonLink className={mobileCtaClass} href="/launch/new/connect">
          Continue to Connect
        </ButtonLink>
      </div>
    </>
  )
}
