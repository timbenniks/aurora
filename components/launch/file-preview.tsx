"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import type { GeneratedFile } from "@/lib/aurora/types"
import { mobileCtaClass } from "@/lib/aurora/layout"
import { previewPathClass } from "@/lib/aurora/voxel"
import { cn } from "@/lib/utils"

const fileSelectClassName =
  "h-11 w-full min-w-0 rounded-none border-2 border-border border-t-white/15 border-l-white/10 bg-input px-3 text-lg text-foreground shadow-[3px_3px_0_0_var(--voxel-shadow)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/60"

function splitPath(path: string) {
  const index = path.lastIndexOf("/")

  if (index === -1) {
    return { name: path, directory: "" }
  }

  return {
    name: path.slice(index + 1),
    directory: path.slice(0, index),
  }
}

function FilePicker({
  files,
  selectedPath,
  onSelect,
  className,
}: {
  files: GeneratedFile[]
  selectedPath: string
  onSelect: (path: string) => void
  className?: string
}) {
  return (
    <div className={className}>
      <label
        htmlFor="preview-file-select"
        className="text-sm leading-relaxed text-muted-foreground"
      >
        Generated file
      </label>
      <select
        id="preview-file-select"
        className={cn("mt-2", fileSelectClassName)}
        value={selectedPath}
        onChange={(event) => onSelect(event.target.value)}
      >
        {files.map((file) => (
          <option key={file.path} value={file.path}>
            {file.path}
          </option>
        ))}
      </select>
    </div>
  )
}

function FileList({
  files,
  selectedPath,
  onSelect,
}: {
  files: GeneratedFile[]
  selectedPath: string
  onSelect: (path: string) => void
}) {
  return (
    <ul className="flex max-h-[min(70vh,40rem)] flex-col gap-1 overflow-y-auto border-2 border-border bg-input p-2">
      {files.map((file) => {
        const active = file.path === selectedPath
        const { name, directory } = splitPath(file.path)

        return (
          <li key={file.path}>
            <button
              type="button"
              title={file.path}
              onClick={() => onSelect(file.path)}
              className={cn(
                "w-full min-h-11 px-3 py-2 text-left transition-colors",
                active
                  ? "border-2 border-highlight bg-accent shadow-[2px_2px_0_0_var(--voxel-shadow)]"
                  : "border-2 border-transparent hover:bg-accent"
              )}
            >
              <span
                className={cn(
                  "block text-lg leading-tight",
                  active ? "text-primary" : "text-foreground"
                )}
              >
                {name}
              </span>
              {directory ? (
                <span className="mt-0.5 block truncate text-base text-muted-foreground">
                  {directory}
                </span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function FileContentViewer({ file }: { file: GeneratedFile }) {
  const [copied, setCopied] = useState(false)
  const lineCount = file.content.split("\n").length

  async function handleCopy() {
    await navigator.clipboard.writeText(file.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-[min(50vh,28rem)] min-w-0 flex-1 flex-col border-2 border-border bg-input shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] lg:min-h-[min(70vh,40rem)]">
      <div className="flex flex-col gap-3 border-b-2 border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={cn(previewPathClass, "text-foreground")}>{file.path}</p>
          <p className="mt-1 text-base text-muted-foreground">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("shrink-0", mobileCtaClass, "sm:w-auto")}
          onClick={handleCopy}
        >
          {copied ? "Copied" : "Copy contents"}
        </Button>
      </div>
      <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[15px] leading-6 whitespace-pre text-foreground">
        {file.content}
      </pre>
    </div>
  )
}

type FilePreviewProps = {
  files: GeneratedFile[]
}

export function FilePreview({ files }: FilePreviewProps) {
  const [selectedPath, setSelectedPath] = useState(files[0]?.path ?? "")
  const selected =
    files.find((file) => file.path === selectedPath) ?? files[0] ?? null

  if (files.length === 0) {
    return (
      <p className="text-lg text-muted-foreground">No files generated.</p>
    )
  }

  if (!selected) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <FilePicker
        className="lg:hidden"
        files={files}
        selectedPath={selected.path}
        onSelect={setSelectedPath}
      />

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:items-stretch">
        <div className="hidden lg:block">
          <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
            {files.length} files
          </p>
          <FileList
            files={files}
            selectedPath={selected.path}
            onSelect={setSelectedPath}
          />
        </div>

        <FileContentViewer file={selected} />
      </div>
    </div>
  )
}
