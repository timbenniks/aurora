"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { mobileCtaClass } from "@/lib/aurora/layout"

type LaunchAgentButtonProps = {
  workspaceId: string
  taskId: string
  className?: string
}

export function LaunchAgentButton({
  workspaceId,
  taskId,
  className,
}: LaunchAgentButtonProps) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isLaunching, setIsLaunching] = useState(false)

  async function handleLaunch() {
    setIsLaunching(true)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/launch-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId }),
        }
      )

      const data = (await response.json()) as {
        error?: string
        agentUrl?: string
      }

      if (!response.ok) {
        setMessage(data.error ?? "Could not launch Cursor agent.")
        return
      }

      setMessage("Cursor agent launched.")
      router.refresh()
    } catch {
      setMessage("Could not launch Cursor agent.")
    } finally {
      setIsLaunching(false)
    }
  }

  return (
    <div className={className}>
      <Button
        className={mobileCtaClass}
        disabled={isLaunching}
        type="button"
        onClick={handleLaunch}
      >
        {isLaunching ? "Launching…" : "Launch Cursor agent"}
      </Button>

      {message ? (
        <p className="mt-2 text-base text-muted-foreground">{message}</p>
      ) : null}
    </div>
  )
}
