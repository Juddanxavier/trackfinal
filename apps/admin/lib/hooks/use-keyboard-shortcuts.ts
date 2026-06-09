"use client"

import { useEffect } from "react"

type ShortcutMap = Record<string, { handler: () => void; description: string }>

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform)

function normalizeKey(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.metaKey || (isMac && e.ctrlKey)) parts.push("Meta")
  else if (e.ctrlKey) parts.push("Ctrl")
  if (e.altKey) parts.push("Alt")
  if (e.shiftKey) parts.push("Shift")
  const key = e.key === " " ? "Space" : e.key
  parts.push(key.length === 1 ? key.toUpperCase() : key)
  return parts.join("+")
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled || Object.keys(shortcuts).length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      const combo = normalizeKey(e)
      const shortcut = shortcuts[combo]
      if (shortcut) {
        e.preventDefault()
        shortcut.handler()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts, enabled])
}
