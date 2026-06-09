"use client"

import { toast } from "sonner"

interface UndoActionOptions {
  description: string
  undoLabel?: string
  duration?: number
  onUndo: () => void
}

export function useUndoAction() {
  function fire(options: UndoActionOptions) {
    toast(options.description, {
      action: {
        label: options.undoLabel ?? "Undo",
        onClick: options.onUndo,
      },
      duration: options.duration ?? 5000,
    })
  }

  return { fire }
}
