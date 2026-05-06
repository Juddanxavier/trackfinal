"use client"

import { motion } from "framer-motion"
import { Package, Truck, FileText, CheckCircle } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

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

interface StatConfig {
  title: string
  value: number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  bg: string
  text: string
  chartColor: string
}

function MiniSparkline({ color }: { color: string }) {
  const data = Array.from({ length: 7 }, () => ({
    value: Math.floor(Math.random() * 50) + 25,
  }))

  return (
    <ResponsiveContainer width="100%" height={24}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`dash-spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#dash-spark-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DashboardStatsCards({ shipmentStats, quoteStats }: DashboardStatsProps) {
  const stats: StatConfig[] = [
    {
      title: "Total Shipments",
      value: shipmentStats?.total || 0,
      subtitle: `${shipmentStats?.recent || 0} new this week`,
      icon: Package,
      bg: "bg-blue-50 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      chartColor: "#3b82f6",
    },
    {
      title: "In Transit",
      value: shipmentStats?.in_transit || 0,
      subtitle: "Active shipments",
      icon: Truck,
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      text: "text-indigo-600 dark:text-indigo-400",
      chartColor: "#6366f1",
    },
    {
      title: "Total Quotes",
      value: quoteStats?.total || 0,
      subtitle: `${quoteStats?.recent || 0} new this week`,
      icon: FileText,
      bg: "bg-purple-50 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      chartColor: "#a855f7",
    },
    {
      title: "Accepted",
      value: quoteStats?.accepted || 0,
      subtitle: `${quoteStats?.rejected || 0} rejected`,
      icon: CheckCircle,
      bg: "bg-green-50 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
      chartColor: "#22c55e",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
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
        </motion.div>
      ))}
    </div>
  )
}