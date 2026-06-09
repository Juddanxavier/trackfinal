"use client"

import { Package, Truck, FileText, CheckCircle } from "lucide-react"
import { StatsCard, StatsCardGrid } from "@/components/stats-card"

interface DashboardStatsProps {
  shipmentStats?: {
    total: number
    in_transit: number
    recent?: number
  } | null
  quoteStats?: {
    total: number
    accepted: number
    rejected?: number
    recent?: number
  } | null
}

export function DashboardStatsCards({
  shipmentStats,
  quoteStats,
}: DashboardStatsProps) {
  return (
    <StatsCardGrid>
      <StatsCard
        title="Total Shipments"
        value={shipmentStats?.total || 0}
        subtitle={`${shipmentStats?.recent || 0} new this week`}
        icon={<Package className="h-4 w-4" />}
        color="blue"
        variant="gradient"
        animated
        delay={0}
      />
      <StatsCard
        title="In Transit"
        value={shipmentStats?.in_transit || 0}
        subtitle="Active shipments"
        icon={<Truck className="h-4 w-4" />}
        color="indigo"
        variant="gradient"
        animated
        delay={0.1}
      />
      <StatsCard
        title="Total Quotes"
        value={quoteStats?.total || 0}
        subtitle={`${quoteStats?.recent || 0} new this week`}
        icon={<FileText className="h-4 w-4" />}
        color="purple"
        variant="gradient"
        animated
        delay={0.2}
      />
      <StatsCard
        title="Accepted"
        value={quoteStats?.accepted || 0}
        subtitle={`${quoteStats?.rejected || 0} rejected`}
        icon={<CheckCircle className="h-4 w-4" />}
        color="green"
        variant="gradient"
        animated
        delay={0.3}
      />
    </StatsCardGrid>
  )
}
