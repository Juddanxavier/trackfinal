'use client'

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-12 w-96" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  )
}