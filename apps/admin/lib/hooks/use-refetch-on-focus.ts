"use client"

import { useEffect, useRef } from "react"

export function useRefetchOnFocus(refetch: () => void, enabled = true) {
  const refetched = useRef(false)

  useEffect(() => {
    if (!enabled) return

    const handleFocus = () => {
      if (refetched.current) {
        refetch()
      }
      refetched.current = true
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [refetch, enabled])
}
