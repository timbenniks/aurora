"use client"

import { useCallback, useEffect, useState } from "react"

import {
  getLaunchBriefDraftSnapshot,
  isLaunchBriefValidated,
  saveLaunchBriefDraft,
  subscribeToLaunchBrief,
} from "@/lib/launch/brief-storage"

/**
 * Launch brief draft state backed by localStorage. Server renders empty and
 * the effect syncs the stored draft after mount — localStorage is not
 * available during SSR, and this avoids hydration mismatches.
 */
export function useLaunchBrief() {
  const [briefJson, setBriefJsonState] = useState("")
  const [isValidated, setIsValidated] = useState(false)

  useEffect(() => {
    function sync() {
      setBriefJsonState(getLaunchBriefDraftSnapshot())
      setIsValidated(isLaunchBriefValidated())
    }

    sync()
    return subscribeToLaunchBrief(sync)
  }, [])

  const setBriefJson = useCallback((value: string) => {
    saveLaunchBriefDraft(value)
  }, [])

  return { briefJson, setBriefJson, isValidated }
}
