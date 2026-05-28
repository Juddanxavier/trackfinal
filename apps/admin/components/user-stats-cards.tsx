"use client"

import {
  UsersIcon,
  UserCheckIcon,
  UserPlusIcon,
  ShieldIcon,
} from "lucide-react"
import { StatsCard, StatsCardGrid } from "@/components/stats-card"

export function UserStatsCards({
  total,
  active,
  customers,
  staff,
}: {
  total: number
  active: number
  customers: number
  staff: number
}) {
  return (
    <StatsCardGrid>
      <StatsCard
        title="Total Users"
        value={total}
        icon={<UsersIcon className="h-4 w-4" />}
        color="blue"
        trend={12}
      />
      <StatsCard
        title="Active Users"
        value={active}
        icon={<UserCheckIcon className="h-4 w-4" />}
        color="green"
        trend={8}
      />
      <StatsCard
        title="Customers"
        value={customers}
        icon={<UserPlusIcon className="h-4 w-4" />}
        color="orange"
        trend={15}
      />
      <StatsCard
        title="Staff Team"
        value={staff}
        icon={<ShieldIcon className="h-4 w-4" />}
        color="purple"
        trend={-2}
      />
    </StatsCardGrid>
  )
}
