"use client"

import { Badge } from "@/components/ui/badge"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  UsersIcon,
  UserCheckIcon,
  UserPlusIcon,
  ShieldIcon,
} from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  trend?: number
  trendPositive?: boolean
  icon: React.ReactNode
  color: "blue" | "purple" | "pink" | "rose" | "orange" | "teal"
}

function getVariantStyles(color: StatCardProps["color"]) {
  const colors = {
    blue: {
      gradient: "from-blue-500/40 via-blue-900 to-blue-500/50",
      border: "border-blue-500/30 dark:border-blue-500/15",
      icon: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
      glow: "group-hover:shadow-[0_0_40px_-8px_rgba(59,130,246,0.5)]",
      badge: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
    },
    purple: {
      gradient: "from-violet-500/40 via-violet-900 to-violet-500/50",
      border: "border-violet-500/30 dark:border-violet-500/15",
      icon: "text-violet-600 dark:text-violet-400",
      dot: "bg-violet-500",
      glow: "group-hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.5)]",
      badge:
        "bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300",
    },
    pink: {
      gradient: "from-pink-500/40 via-pink-900 to-pink-500/50",
      border: "border-pink-500/30 dark:border-pink-500/15",
      icon: "text-pink-600 dark:text-pink-400",
      dot: "bg-pink-500",
      glow: "group-hover:shadow-[0_0_40px_-8px_rgba(236,72,153,0.5)]",
      badge: "bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300",
    },
    rose: {
      gradient: "from-rose-500/40 via-rose-900 to-rose-500/50",
      border: "border-rose-500/30 dark:border-rose-500/15",
      icon: "text-rose-600 dark:text-rose-400",
      dot: "bg-rose-500",
      glow: "group-hover:shadow-[0_0_40px_-8px_rgba(244,63,94,0.5)]",
      badge: "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300",
    },
    orange: {
      gradient: "from-orange-500/40 via-orange-900 to-orange-500/50",
      border: "border-orange-500/30 dark:border-orange-500/15",
      icon: "text-orange-600 dark:text-orange-400",
      dot: "bg-orange-500",
      glow: "group-hover:shadow-[0_0_40px_-8px_rgba(249,115,22,0.5)]",
      badge:
        "bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300",
    },
    teal: {
      gradient: "from-teal-500/40 via-teal-900 to-teal-500/50",
      border: "border-teal-500/30 dark:border-teal-500/15",
      icon: "text-teal-600 dark:text-teal-400",
      dot: "bg-teal-500",
      glow: "group-hover:shadow-[0_0_40px_-8px_rgba(20,184,166,0.5)]",
      badge: "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300",
    },
  }
  return colors[color]
}

function StatCard({
  title,
  value,
  trend,
  trendPositive,
  icon,
  color,
}: StatCardProps) {
  const styles = getVariantStyles(color)

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${styles.border} bg-white/30 shadow-sm backdrop-blur-xl transition-all duration-300 hover:z-10 hover:scale-105 dark:bg-black/20 ${styles.glow}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-70`}
      />
      <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/30 blur-2xl transition-transform duration-500 group-hover:scale-150 group-hover:rotate-180 dark:bg-white/10" />
      <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/20 blur-xl transition-transform duration-700 group-hover:scale-125 dark:bg-white/5" />

      <div className="relative p-4">
        <div className="mb-2 flex items-center justify-between">
          <div
            className={`rounded-lg border border-white/30 bg-white/40 p-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/10 ${styles.icon}`}
          >
            {icon}
          </div>
          <div
            className={`h-1.5 w-1.5 rounded-full ${styles.dot} opacity-60 transition-all duration-300 group-hover:scale-150 group-hover:opacity-100`}
          />
        </div>

        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>

        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1.5">
            <Badge
              className={`h-4 border-0 px-1 py-0.5 text-[9px] font-medium ${styles.badge}`}
            >
              {trendPositive ? (
                <TrendingUpIcon className="mr-0.5 size-2" />
              ) : (
                <TrendingDownIcon className="mr-0.5 size-2" />
              )}
              {Math.abs(trend)}%
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}

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
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
      <StatCard
        title="Total Users"
        value={total}
        trend={12}
        trendPositive={true}
        color="blue"
        icon={<UsersIcon className="size-4" />}
      />
      <StatCard
        title="Active Users"
        value={active}
        trend={8}
        trendPositive={true}
        color="teal"
        icon={<UserCheckIcon className="size-4" />}
      />
      <StatCard
        title="Customers"
        value={customers}
        trend={15}
        trendPositive={true}
        color="orange"
        icon={<UserPlusIcon className="size-4" />}
      />
      <StatCard
        title="Staff Team"
        value={staff}
        trend={2}
        trendPositive={false}
        color="purple"
        icon={<ShieldIcon className="size-4" />}
      />
    </div>
  )
}
