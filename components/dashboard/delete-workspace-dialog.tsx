"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Panel } from "@/components/panel"

type DeleteWorkspaceDialogProps = {
  workspaceId: string
  repoName: string
  fullName: string
  className?: string
}

export function DeleteWorkspaceDialog({
  workspaceId,
  repoName,
  fullName,
  className,
}: DeleteWorkspaceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(data.error ?? "Could not delete workspace.")
        return
      }

      router.push("/workspaces?deleted=1")
      router.refresh()
    } catch {
      setError("Could not delete workspace.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={className}>
      <Panel interactive={false} className="border-destructive/30">
        <h2 className="text-sm text-destructive">Danger zone</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Permanently delete the GitHub repository and remove it from Aurora.
          This cannot be undone.
        </p>

        {!open ? (
          <Button
            className="mt-4"
            type="button"
            variant="destructive"
            onClick={() => setOpen(true)}
          >
            Delete repository
          </Button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-base">
              Type <strong>{repoName}</strong> or <strong>{fullName}</strong> to
              confirm.
            </p>
            <Input
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={repoName}
              autoComplete="off"
            />
            {error ? (
              <p className="text-base text-destructive">{error}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting || confirmName.trim().length === 0}
                onClick={handleDelete}
              >
                {isDeleting ? "Deleting…" : "Confirm delete"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => {
                  setOpen(false)
                  setConfirmName("")
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  )
}
