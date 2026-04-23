"use client"

import {
  FileText,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface StatCardProps {
  title: string
  value: number
  color: "blue" | "yellow" | "green" | "red" | "purple"
  data?: { value: number }[]
}

function StatCard({ title, value, color, data }: StatCardProps) {
  const colors: Record<string, { border: string; bg: string; text: string; stroke: string }> = {
    blue: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-600", stroke: "#3b82f6" },
    yellow: { border: "border-yellow-500/40", bg: "bg-yellow-500/10", text: "text-yellow-600", stroke: "#eab308" },
    green: { border: "border-green-500/40", bg: "bg-green-500/10", text: "text-green-600", stroke: "#22c55e" },
    red: { border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-600", stroke: "#ef4444" },
    purple: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-600", stroke: "#a855f7" },
  }

  const c = colors[color]

  return (
    <div className={`relative rounded-xl border-2 ${c.border} ${c.bg} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`rounded-full p-2 ${c.bg} ${c.text}`}>
          {color === "blue" && <FileText className="h-5 w-5" />}
          {color === "yellow" && <Clock className="h-5 w-5" />}
          {color === "green" && <CheckCircle2 className="h-5 w-5" />}
          {color === "red" && <XCircle className="h-5 w-5" />}
          {color === "purple" && <DollarSign className="h-5 w-5" />}
        </div>
      </div>
      
      {data && data.length > 0 && (
        <div className="h-10 mt-2 -mx-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.stroke} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={c.stroke}
                strokeWidth={2}
                fill={`url(#grad-${color})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

interface QuoteStatsCardsProps {
  total: number
  pending: number
  quoted: number
  accepted: number
  rejected: number
  historyData?: {
    pending: { value: number }[]
    quoted: { value: number }[]
    accepted: { value: number }[]
    rejected: { value: number }[]
  }
}

export function QuoteStatsCards({
  total,
  pending,
  quoted,
  accepted,
  rejected,
  historyData,
}: QuoteStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <StatCard title="Total" value={total} color="blue" />
      <StatCard title="Pending" value={pending} color="yellow" data={historyData?.pending} />
      <StatCard title="Quoted" value={quoted} color="purple" data={historyData?.quoted} />
      <StatCard title="Accepted" value={accepted} color="green" data={historyData?.accepted} />
      <StatCard title="Rejected" value={rejected} color="red" data={historyData?.rejected} />
    </div>
  )
}