"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mobileCtaClass } from "@/lib/aurora/layout"

type CursorApiKeyFormProps = {
  connected: boolean
  apiKeyHint?: string
  apiKeyName?: string
  autoLaunchAgent: boolean
}

export function CursorApiKeyForm({
  connected,
  apiKeyHint,
  apiKeyName,
  autoLaunchAgent: initialAutoLaunch,
}: CursorApiKeyFormProps) {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [autoLaunchAgent, setAutoLaunchAgent] = useState(initialAutoLaunch)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/cursor/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, autoLaunchAgent }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setMessage(data.error ?? "Could not save Cursor API key.")
        return
      }

      setApiKey("")
      setMessage("Cursor API key connected.")
      router.refresh()
    } catch {
      setMessage("Could not save Cursor API key.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemove() {
    setIsRemoving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/cursor/api-key", { method: "DELETE" })
      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setMessage(data.error ?? "Could not remove Cursor API key.")
        return
      }

      setMessage("Cursor API key removed.")
      router.refresh()
    } catch {
      setMessage("Could not remove Cursor API key.")
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {connected ? (
        <p className="text-lg text-success">
          Connected{apiKeyName ? ` as ${apiKeyName}` : ""}
          {apiKeyHint ? ` (${apiKeyHint})` : ""}.
        </p>
      ) : (
        <p className="text-lg text-muted-foreground">
          Add a Cursor API key to launch Cloud Agents automatically after
          workspace creation.
        </p>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSave}>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Cursor API key</span>
          <Input
            type="password"
            autoComplete="off"
            placeholder={connected ? "Paste a new key to replace" : "Paste API key"}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </label>

        <label className="flex items-center gap-3 text-lg">
          <input
            checked={autoLaunchAgent}
            className="size-4 accent-primary"
            type="checkbox"
            onChange={(event) => setAutoLaunchAgent(event.target.checked)}
          />
          <span>Launch first agent automatically after workspace creation</span>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className={mobileCtaClass}
            disabled={isSaving || !apiKey.trim()}
            type="submit"
          >
            {isSaving ? "Saving…" : connected ? "Update key" : "Connect Cursor"}
          </Button>

          {connected ? (
            <Button
              className={mobileCtaClass}
              disabled={isRemoving}
              type="button"
              variant="outline"
              onClick={handleRemove}
            >
              {isRemoving ? "Removing…" : "Remove key"}
            </Button>
          ) : null}
        </div>
      </form>

      {message ? <p className="text-base text-muted-foreground">{message}</p> : null}

      <p className="text-base text-muted-foreground">
        Create an API key in{" "}
        <a
          className="text-primary underline-offset-4 hover:underline"
          href="https://cursor.com/dashboard?tab=integrations"
          rel="noreferrer"
          target="_blank"
        >
          Cursor Dashboard → Integrations
        </a>
        .
      </p>
    </div>
  )
}
