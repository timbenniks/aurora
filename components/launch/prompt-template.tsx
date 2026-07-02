"use client"

import { useState } from "react"

import { Panel } from "@/components/panel"
import { Button } from "@/components/ui/button"
import {
  EXTERNAL_GENERATE_PROMPT,
  EXTERNAL_INTERVIEW_PROMPT,
} from "@/lib/aurora/external-prompt"
import { mobileCtaClass } from "@/lib/aurora/layout"
import { cn } from "@/lib/utils"

function PromptBlock({
  title,
  description,
  prompt,
  copyLabel,
}: {
  title: string
  description: string
  prompt: string
  copyLabel: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-6 border-t-2 border-[#243049] pt-6 first:mt-0 first:border-t-0 first:pt-0">
      <h3 className="text-sm leading-relaxed">{title}</h3>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{description}</p>
      <details className="mt-4">
        <summary className="cursor-pointer font-pixel-heading text-xs uppercase tracking-wide text-primary">
          Show prompt text
        </summary>
        <pre className="mt-4 max-h-72 overflow-auto border-2 border-[#243049] bg-[#080e18] p-4 text-sm whitespace-pre-wrap text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          {prompt}
        </pre>
      </details>
      <Button
        className={cn("mt-4", mobileCtaClass)}
        type="button"
        onClick={handleCopy}
      >
        {copied ? "Copied" : copyLabel}
      </Button>
    </div>
  )
}

export function PromptTemplate() {
  return (
    <Panel>
      <h2 className="text-sm leading-relaxed">1. Plan with your LLM</h2>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground md:text-xl">
        Use two prompts in the same chat: first shape your idea together, then
        generate the JSON to paste below.
      </p>

      <PromptBlock
        title="Step A — Start the conversation"
        description="Paste this into a new LLM chat, then describe your idea. Answer its questions until you are happy with the plan. It will not dump JSON yet."
        prompt={EXTERNAL_INTERVIEW_PROMPT}
        copyLabel="Copy interview prompt"
      />

      <PromptBlock
        title="Step B — Generate JSON"
        description='When planning is done, paste this in the same chat (after saying something like "generate launch brief"). Copy the JSON it returns into step 2 below.'
        prompt={EXTERNAL_GENERATE_PROMPT}
        copyLabel="Copy generate prompt"
      />
    </Panel>
  )
}
