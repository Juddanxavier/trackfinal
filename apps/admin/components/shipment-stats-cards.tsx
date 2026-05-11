"use client"

import { PackageCheckIcon, ClockIcon, Package, CheckCircleIcon } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface Stats {
  total: number
  pending: number
  inTransit: number
  delivered: number
  totalChange?: number
  pendingChange?: number
  inTransitChange?: number
  deliveredChange?: number
}

interface StatConfig {
  title: string
  key: keyof Stats
  icon: React.ComponentType<{ className?: string }>
  bg: string
  text: string
  chartColor: string
}

const statsConfig: StatConfig[] = [
  { title: "Total", key: "total", icon: PackageCheckIcon, bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", chartColor: "#3b82f6" },
  { title: "Pending", key: "pending", icon: ClockIcon, bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", chartColor: "#f59e0b" },
  { title: "In Transit", key: "inTransit", icon: Package, bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", chartColor: "#a855f7" },
  { title: "Delivered", key: "delivered", icon: CheckCircleIcon, bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", chartColor: "#10b981" },
]

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
          <linearGradient id={`ship-spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#ship-spark-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function ShipmentStatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {statsConfig.map((stat) => {
        const value = stats[stat.key] as number
        const pct = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0
        
        let subtitle = ""
        switch (stat.key) {
          case "total": subtitle = "All shipments"; break
          case "pending": subtitle = `${pct}% awaiting`; break
          case "inTransit": subtitle = `${pct}% on the way`; break
          case "delivered": subtitle = `${pct}% delivered`; break
        }

        return (
          <div
            key={stat.key}
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
            <p className="mt-2 text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            <MiniSparkline color={stat.chartColor} />
          </div>
        )
      })}
    </div>
  )
}