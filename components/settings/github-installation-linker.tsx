"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export function GitHubInstallationLinker() {
  const { data: session, status, update } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const attemptedInstallationId = useRef<string | null>(null)

  useEffect(() => {
    const installationId = searchParams.get("installation_id")

    if (!installationId || status !== "authenticated") {
      return
    }

    if (session?.githubInstallationId === installationId) {
      router.replace("/settings")
      return
    }

    if (attemptedInstallationId.current === installationId) {
      return
    }

    attemptedInstallationId.current = installationId

    async function linkInstallation() {
      setMessage("Linking GitHub App installation…")

      try {
        const response = await fetch("/api/github/installation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            installationId: Number(installationId),
          }),
        })

        const data = (await response.json()) as {
          ok?: boolean
          installationId?: string
          error?: string
        }

        if (!response.ok || !data.ok || !data.installationId) {
          setMessage(data.error ?? "Could not link GitHub App installation.")
          router.replace("/settings")
          return
        }

        await update({ githubInstallationId: data.installationId })
        setMessage("GitHub App connected.")
        router.replace("/settings")
      } catch {
        setMessage("Could not link GitHub App installation.")
        router.replace("/settings")
      }
    }

    void linkInstallation()
  }, [router, searchParams, session?.githubInstallationId, status, update])

  if (!message) {
    return null
  }

  return <p className="mt-3 text-lg text-muted-foreground">{message}</p>
}
