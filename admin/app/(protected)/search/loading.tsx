'use client'

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-10 w-32" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  )
}