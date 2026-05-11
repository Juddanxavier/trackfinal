"use client"

import { TruckIcon, CheckCircleIcon, CircleDotIcon, FileTextIcon } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface ReportStats {
  shipments: {
    total: number
    delivered: number
    deliveryRate: number
    avgTransitDays: number
  }
  quotes: {
    total: number
    conversionRate: number
  }
}

interface ReportStatsCardsProps {
  stats?: ReportStats | null
}

interface StatConfig {
  title: string
  value: number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  bg: string
  text: string
  chartColor: string
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
          <linearGradient id={`report-spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#report-spark-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function ReportStatsCards({ stats }: ReportStatsCardsProps) {
  const statsConfig: StatConfig[] = [
    {
      title: "Total Shipments",
      value: stats?.shipments.total ?? 0,
      subtitle: "All shipments",
      icon: TruckIcon,
      bg: "bg-blue-50 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      chartColor: "#3b82f6",
    },
    {
      title: "Delivered",
      value: stats?.shipments.delivered ?? 0,
      subtitle: `${stats?.shipments.avgTransitDays?.toFixed(1) || 0} days avg`,
      icon: CheckCircleIcon,
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
      chartColor: "#10b981",
    },
    {
      title: "Delivery Rate",
      value: Math.round((stats?.shipments.deliveryRate ?? 0) * 100),
      subtitle: `${stats?.shipments.avgTransitDays?.toFixed(1) || 0} days avg`,
      icon: CircleDotIcon,
      bg: "bg-amber-50 dark:bg-amber-900/30",
      text: "text-amber-600 dark:text-amber-400",
      chartColor: "#f59e0b",
    },
    {
      title: "Total Quotes",
      value: stats?.quotes.total ?? 0,
      subtitle: `${((stats?.quotes.conversionRate ?? 0) * 100).toFixed(0)}% conversion`,
      icon: FileTextIcon,
      bg: "bg-purple-50 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      chartColor: "#a855f7",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {statsConfig.map((stat) => (
        <div
          key={stat.title}
          className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 hover:border-gray-300"
        >
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.title}
            </p>
            <div className={`rounded-md p-1.5 ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.text}`} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{stat.value.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
          <MiniSparkline color={stat.chartColor} />
        </div>
      ))}
    </div>
  )
}