"use client"

import { useEffect, useCallback } from "react"

export function useUnsavedChanges(isDirty: boolean) {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ""
    },
    [isDirty]
  )

  useEffect(() => {
    if (!isDirty) return
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty, handleBeforeUnload])
}
