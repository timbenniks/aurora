"use client"

import { Textarea } from "@/components/ui/textarea"

type BriefEditorProps = {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}

export function BriefEditor({ value, onChange, invalid }: BriefEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="launch-brief" className="text-sm leading-relaxed">
        Paste launch brief JSON
      </label>
      <Textarea
        id="launch-brief"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='{ "schema_version": "aurora.launch_brief.v1", ... }'
        spellCheck={false}
        aria-invalid={invalid || undefined}
        className="min-h-80 font-pixel"
      />
    </div>
  )
}
