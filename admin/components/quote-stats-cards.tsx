"use client"

import { FileText, Clock, DollarSign, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface QuoteStatsCardsProps {
  total: number
  pending: number
  quoted: number
  accepted: number
  rejected: number
}

interface SparklineProps {
  data: { value: number }[]
  color: string
}

function Sparkline({ data, color }: SparklineProps) {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace('#', '')})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

const generateSparklineData = (value: number): { value: number }[] => {
  const base = Math.max(1, Math.floor(value / 3))
  return Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(0, base + Math.floor(Math.random() * base) - Math.floor(base / 2))
  }))
}

export function QuoteStatsCards({
  total,
  pending,
  quoted,
  accepted,
  rejected,
}: QuoteStatsCardsProps) {
  const stats = [
    {
      title: "Total",
      value: total,
      icon: FileText,
      color: "#22c55e",
      sparkData: generateSparklineData(total),
    },
    {
      title: "Pending",
      value: pending,
      icon: Clock,
      color: "#eab308",
      sparkData: generateSparklineData(pending),
    },
    {
      title: "Quoted",
      value: quoted,
      icon: DollarSign,
      color: "#a855f7",
      sparkData: generateSparklineData(quoted),
    },
    {
      title: "Accepted",
      value: accepted,
      icon: CheckCircle2,
      color: "#22c55e",
      sparkData: generateSparklineData(accepted),
    },
    {
      title: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "#ef4444",
      sparkData: generateSparklineData(rejected),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.title}
            </p>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
              <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-2">{stat.value.toLocaleString()}</p>
          <Sparkline data={stat.sparkData} color={stat.color} />
        </Card>
      ))}
    </div>
  )
}