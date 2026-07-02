"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { mobileCtaClass } from "@/lib/aurora/layout"

type RefreshWorkspaceButtonProps = {
  workspaceId: string
  className?: string
}

export function RefreshWorkspaceButton({
  workspaceId,
  className,
}: RefreshWorkspaceButtonProps) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function handleRefresh() {
    setIsRefreshing(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/refresh`, {
        method: "POST",
      })

      const data = (await response.json()) as { error?: string; message?: string }

      if (!response.ok) {
        setMessage(data.error ?? "Could not refresh workspace.")
        return
      }

      setMessage(data.message ?? "Refreshed from GitHub.")
      router.refresh()
    } catch {
      setMessage("Could not refresh workspace.")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className={className}>
      <Button
        className={mobileCtaClass}
        type="button"
        variant="outline"
        disabled={isRefreshing}
        onClick={handleRefresh}
      >
        {isRefreshing ? "Refreshing…" : "Refresh from GitHub"}
      </Button>

      {message ? (
        <p className="mt-2 text-base text-muted-foreground">{message}</p>
      ) : null}
    </div>
  )
}
