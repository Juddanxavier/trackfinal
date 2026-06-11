"use client"

import { useEffect, useRef } from "react"

const MIN_REFETCH_INTERVAL = 30_000

export function useRefetchOnFocus(refetch: () => void, enabled = true) {
  const lastRefetch = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const handleFocus = () => {
      const now = Date.now()
      if (now - lastRefetch.current > MIN_REFETCH_INTERVAL) {
        lastRefetch.current = now
        refetch()
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [refetch, enabled])
}
