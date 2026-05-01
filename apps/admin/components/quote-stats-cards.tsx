"use client"

import { FileText, Clock, DollarSign, CheckCircle2, XCircle } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface QuoteStatsCardsProps {
  total: number
  pending: number
  quoted: number
  accepted: number
  rejected: number
}

interface StatConfig {
  title: string
  key: keyof QuoteStatsCardsProps
  icon: React.ComponentType<{ className?: string }>
  bg: string
  text: string
  chartColor: string
}

const statsConfig: StatConfig[] = [
  { title: "Total", key: "total", icon: FileText, bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", chartColor: "#22c55e" },
  { title: "Pending", key: "pending", icon: Clock, bg: "bg-yellow-50 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", chartColor: "#eab308" },
  { title: "Quoted", key: "quoted", icon: DollarSign, bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", chartColor: "#a855f7" },
  { title: "Accepted", key: "accepted", icon: CheckCircle2, bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", chartColor: "#22c55e" },
  { title: "Rejected", key: "rejected", icon: XCircle, bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", chartColor: "#ef4444" },
]

function generateSparklineData(value: number) {
  const base = Math.max(1, Math.floor(value / 3))
  return Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(0, base + Math.floor(Math.random() * base) - Math.floor(base / 2))
  }))
}

function MiniSparkline({ color }: { color: string }) {
  const data = Array.from({ length: 7 }, (_, i) => ({
    value: Math.floor(Math.random() * 50) + 25
  }))

  return (
    <ResponsiveContainer width="100%" height={24}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace("#", "")})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function QuoteStatsCards(props: QuoteStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {statsConfig.map((stat) => {
        const value = props[stat.key] as number
        const pct = props.total > 0 ? Math.round((value / props.total) * 100) : 0
        
        let subtitle = ""
        switch (stat.key) {
          case "total": subtitle = "All quotes"; break
          case "pending": subtitle = `${pct}% of total`; break
          case "quoted": subtitle = `${pct}% of total`; break
          case "accepted": subtitle = `${pct}% success rate`; break
          case "rejected": subtitle = `${pct}% of total`; break
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