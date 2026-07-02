"use client"

import { useState } from "react"

import { BriefEditor } from "@/components/launch/brief-editor"
import { LaunchStepper } from "@/components/launch/launch-stepper"
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
import {
  clearLaunchBrief,
  markLaunchBriefValidated,
} from "@/lib/launch/brief-storage"
import { useLaunchBrief } from "@/lib/launch/use-launch-brief"
import { cn } from "@/lib/utils"

type ValidateApiResponse = Pick<
  ValidationResult,
  "valid" | "errors" | "warnings" | "summary"
>

function BriefActions({
  briefJson,
  isValidated,
  isValidating,
  onValidate,
  onClear,
  className,
}: {
  briefJson: string
  isValidated: boolean
  isValidating: boolean
  onValidate: () => void
  onClear: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3",
        className
      )}
    >
      <Button
        className={mobileCtaClass}
        type="button"
        disabled={isValidating || !briefJson.trim()}
        onClick={onValidate}
      >
        {isValidating ? "Validating..." : "Validate brief"}
      </Button>

      {isValidated ? (
        <ButtonLink className={mobileCtaClass} href="/launch/new/review">
          Continue to review
        </ButtonLink>
      ) : (
        <Button className={mobileCtaClass} variant="outline" disabled>
          Continue to review
        </Button>
      )}

      {briefJson.trim() ? (
        <Button
          className={mobileCtaClass}
          type="button"
          variant="outline"
          onClick={onClear}
        >
          Start over
        </Button>
      ) : null}
    </div>
  )
}

export function BriefStep() {
  const { briefJson, setBriefJson, isValidated } = useLaunchBrief()
  const [result, setResult] = useState<ValidateApiResponse | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  function handleClear() {
    clearLaunchBrief()
    setResult(null)
    setRequestError(null)
  }

  async function handleValidate() {
    setIsValidating(true)
    setRequestError(null)

    try {
      let parsedJson: unknown

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
        markLaunchBriefValidated(briefJson)
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
          title="Create new project"
          description="Copy the interview prompt, shape your idea with an LLM, then paste and validate the launch brief JSON."
        />

        <LaunchStepper current="brief" />

        <PromptTemplate />

        <FeaturePanel
          title="Validate brief"
          description="Paste your launch brief JSON below. Validation unlocks the next steps."
        >
          <BriefEditor
            value={briefJson}
            onChange={setBriefJson}
            invalid={showInvalidEditor}
          />

          {requestError ? (
            <p className="mt-3 text-lg text-destructive">{requestError}</p>
          ) : null}

          <BriefActions
            className="mt-4 hidden md:flex"
            briefJson={briefJson}
            isValidated={isValidated}
            isValidating={isValidating}
            onValidate={handleValidate}
            onClear={handleClear}
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

        {showMobileStickyBar ? (
          <div className={mobileStickyFooterSpacerClass} aria-hidden />
        ) : null}
      </PageFrame>

      {showMobileStickyBar ? (
        <div className={mobileStickyFooterClass}>
          <BriefActions
            briefJson={briefJson}
            isValidated={isValidated}
            isValidating={isValidating}
            onValidate={handleValidate}
            onClear={handleClear}
          />
        </div>
      ) : null}
    </>
  )
}
