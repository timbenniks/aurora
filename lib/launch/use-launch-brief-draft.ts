"use client"

import { useCallback, useSyncExternalStore } from "react"

import {
  getLaunchBriefDraftSnapshot,
  saveLaunchBriefDraft,
  subscribeToLaunchBriefDraft,
} from "@/lib/launch/brief-storage"

export function useLaunchBriefDraft() {
  const briefJson = useSyncExternalStore(
    subscribeToLaunchBriefDraft,
    getLaunchBriefDraftSnapshot,
    () => ""
  )

  const setBriefJson = useCallback((value: string) => {
    saveLaunchBriefDraft(value)
  }, [])

  return { briefJson, setBriefJson }
}
