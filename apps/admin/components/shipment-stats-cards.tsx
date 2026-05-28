"use client"

import {
  PackageCheckIcon,
  ClockIcon,
  Package,
  CheckCircleIcon,
} from "lucide-react"
import { StatsCard, StatsCardGrid } from "@/components/stats-card"

interface Stats {
  total: number
  pending: number
  inTransit: number
  delivered: number
}

export function ShipmentStatsCards({ stats }: { stats: Stats }) {
  return (
    <StatsCardGrid>
      <StatsCard
        title="Total"
        value={stats.total}
        subtitle="All shipments"
        icon={<PackageCheckIcon className="h-4 w-4" />}
        color="blue"
      />
      <StatsCard
        title="Pending"
        value={stats.pending}
        subtitle={
          stats.total > 0
            ? `${Math.round((stats.pending / stats.total) * 100)}% awaiting`
            : "0% awaiting"
        }
        icon={<ClockIcon className="h-4 w-4" />}
        color="amber"
      />
      <StatsCard
        title="In Transit"
        value={stats.inTransit}
        subtitle={
          stats.total > 0
            ? `${Math.round((stats.inTransit / stats.total) * 100)}% on the way`
            : "0% on the way"
        }
        icon={<Package className="h-4 w-4" />}
        color="purple"
      />
      <StatsCard
        title="Delivered"
        value={stats.delivered}
        subtitle={
          stats.total > 0
            ? `${Math.round((stats.delivered / stats.total) * 100)}% delivered`
            : "0% delivered"
        }
        icon={<CheckCircleIcon className="h-4 w-4" />}
        color="emerald"
      />
    </StatsCardGrid>
  )
}
