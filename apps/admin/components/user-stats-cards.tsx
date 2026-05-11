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
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  trendPositive?: boolean
  icon: React.ReactNode
  color: "blue" | "purple" | "green" | "orange" | "teal"
}

function getVariantStyles(color: StatCardProps["color"]) {
  const colors = {
    blue: {
      icon: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
      badge: "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
      chartColor: "#3b82f6",
    },
    purple: {
      icon: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30",
      badge: "bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
      chartColor: "#a855f7",
    },
    green: {
      icon: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30",
      badge: "bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300",
      chartColor: "#22c55e",
    },
    orange: {
      icon: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30",
      badge: "bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
      chartColor: "#f97316",
    },
    teal: {
      icon: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30",
      badge: "bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300",
      chartColor: "#14b8a6",
    },
  }
  return colors[color]
}

function MiniSparkline({ color, value = 0 }: { color: string; value?: number }) {
  const data = value === 0 
    ? Array.from({ length: 7 }, () => ({ value: 0 }))
    : [
        { value: 20 + Math.random() * 20 },
        { value: 40 + Math.random() * 20 },
        { value: 30 + Math.random() * 30 },
        { value: 60 + Math.random() * 20 },
        { value: 45 + Math.random() * 25 },
        { value: 70 + Math.random() * 15 },
        { value: 50 + Math.random() * 20 },
      ]

  return (
    <ResponsiveContainer width="100%" height={24}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`user-spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#user-spark-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendPositive,
  icon,
  color,
}: StatCardProps) {
  const styles = getVariantStyles(color)

  return (
    <div
      className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 hover:border-gray-300"
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-md p-2 ${styles.icon}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <Badge
            className={`flex items-center gap-1 border-0 px-2 py-0.5 text-xs font-medium ${styles.badge}`}
          >
            {trendPositive ? (
              <TrendingUpIcon className="size-3" />
            ) : (
              <TrendingDownIcon className="size-3" />
            )}
            {Math.abs(trend)}%
          </Badge>
        )}
      </div>

      <div className="mt-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <MiniSparkline color={styles.chartColor} />
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        title="Total Users"
        value={total}
        trend={12}
        trendPositive={true}
        color="blue"
        icon={<UsersIcon className="size-5" />}
      />
      <StatCard
        title="Active Users"
        value={active}
        trend={8}
        trendPositive={true}
        color="green"
        icon={<UserCheckIcon className="size-5" />}
      />
      <StatCard
        title="Customers"
        value={customers}
        trend={15}
        trendPositive={true}
        color="orange"
        icon={<UserPlusIcon className="size-5" />}
      />
      <StatCard
        title="Staff Team"
        value={staff}
        trend={2}
        trendPositive={false}
        color="purple"
        icon={<ShieldIcon className="size-5" />}
      />
    </div>
  )
}