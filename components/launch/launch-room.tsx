"use client"

import { useState } from "react"

import { BriefEditor } from "@/components/launch/brief-editor"
import { PromptTemplate } from "@/components/launch/prompt-template"
import { ValidationResults } from "@/components/launch/validation-results"
import { PageFrame } from "@/components/page-frame"
import { PageHeader } from "@/components/page-header"
import { FeaturePanel } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import type { ValidationResult } from "@/lib/aurora/types"
import {
  mobileCtaClass,
  mobileStickyFooterClass,
  mobileStickyFooterSpacerClass,
} from "@/lib/aurora/layout"
import { saveLaunchBrief } from "@/lib/launch/brief-storage"
import { useLaunchBriefDraft } from "@/lib/launch/use-launch-brief-draft"
import { cn } from "@/lib/utils"

type ValidateApiResponse = Pick<
  ValidationResult,
  "valid" | "errors" | "warnings" | "summary"
>

function LaunchActions({
  briefJson,
  result,
  isValidating,
  onValidate,
  className,
}: {
  briefJson: string
  result: ValidateApiResponse | null
  isValidating: boolean
  onValidate: () => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3", className)}>
      <Button
        className={mobileCtaClass}
        type="button"
        disabled={isValidating || !briefJson.trim()}
        onClick={onValidate}
      >
        {isValidating ? "Validating..." : "Validate brief"}
      </Button>

      {result?.valid ? (
        <ButtonLink className={mobileCtaClass} href="/launch/preview">
          Continue to preview
        </ButtonLink>
      ) : (
        <Button className={mobileCtaClass} variant="outline" disabled>
          Continue to preview
        </Button>
      )}
    </div>
  )
}

export function LaunchRoom() {
  const { briefJson, setBriefJson } = useLaunchBriefDraft()
  const [result, setResult] = useState<ValidateApiResponse | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  async function handleValidate() {
    setIsValidating(true)
    setRequestError(null)

    try {
      let parsedJson: unknown = briefJson

      if (briefJson.trim()) {
        try {
          parsedJson = JSON.parse(briefJson)
        } catch {
          setResult({
            valid: false,
            errors: [
              {
                code: "invalid_json",
                message: "Launch brief is not valid JSON.",
                path: "",
              },
            ],
            warnings: [],
          })
          return
        }
      }

      const response = await fetch("/api/launch-brief/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: parsedJson }),
      })

      if (!response.ok) {
        setRequestError("Validation request failed. Try again.")
        return
      }

      const data = (await response.json()) as ValidateApiResponse
      setResult(data)

      if (data.valid) {
        saveLaunchBrief(briefJson.trim() ? briefJson : JSON.stringify(parsedJson))
      }
    } catch {
      setRequestError("Validation request failed. Try again.")
    } finally {
      setIsValidating(false)
    }
  }

  const showInvalidEditor = result !== null && !result.valid
  const showMobileStickyBar = briefJson.trim().length > 0

  return (
    <>
      <PageFrame>
        <PageHeader
          title="Launch room"
          description="Copy the interview prompt, shape your idea with an LLM, then generate JSON and validate it here."
        />

        <PromptTemplate />

        <FeaturePanel
          title="Validate brief"
          description="Paste your launch brief JSON below, then validate before previewing generated files."
        >
          <BriefEditor
            value={briefJson}
            onChange={setBriefJson}
            invalid={showInvalidEditor}
          />

          {requestError ? (
            <p className="mt-3 text-lg text-destructive">{requestError}</p>
          ) : null}

          <LaunchActions
            className="mt-4 hidden md:flex"
            briefJson={briefJson}
            result={result}
            isValidating={isValidating}
            onValidate={handleValidate}
          />
        </FeaturePanel>

        {result ? (
          <ValidationResults
            valid={result.valid}
            errors={result.errors}
            warnings={result.warnings}
            summary={result.summary}
          />
        ) : null}

        <FeaturePanel
          title="Prepare existing repo"
          description="Add Aurora setup files to a repository you already own via a setup pull request."
        >
          {result?.valid ? (
            <ButtonLink className={cn("mt-4", mobileCtaClass)} href="/launch/prepare-existing">
              Select repository
            </ButtonLink>
          ) : (
            <>
              <Button className={cn("mt-4", mobileCtaClass)} variant="outline" disabled>
                Select repository
              </Button>
              <p className="mt-2 text-lg text-muted-foreground">
                Validate your launch brief first.
              </p>
            </>
          )}
        </FeaturePanel>

        {showMobileStickyBar ? (
          <div className={mobileStickyFooterSpacerClass} aria-hidden />
        ) : null}
      </PageFrame>

      {showMobileStickyBar ? (
        <div className={mobileStickyFooterClass}>
          <LaunchActions
            briefJson={briefJson}
            result={result}
            isValidating={isValidating}
            onValidate={handleValidate}
          />
        </div>
      ) : null}
    </>
  )
}
