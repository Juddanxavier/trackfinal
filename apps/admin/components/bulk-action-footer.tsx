"use client"

import { Button } from "@/components/ui/button"

interface BulkAction {
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
}

interface BulkActionFooterProps {
  selectedCount: number
  actions: BulkAction[]
}

export function BulkActionFooter({ selectedCount, actions }: BulkActionFooterProps) {
  if (selectedCount === 0) return null
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedCount} selected
      </span>
      {actions.map((action, i) => (
        <Button
          key={i}
          size="sm"
          variant={action.variant || "default"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
