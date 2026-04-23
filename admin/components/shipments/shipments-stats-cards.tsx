"use client"

import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  color: "blue" | "yellow" | "green" | "red" | "purple"
}

function StatCard({ title, value, color }: StatCardProps) {
  const colors: Record<string, { border: string; bg: string; text: string }> = {
    blue: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-600" },
    yellow: { border: "border-yellow-500/40", bg: "bg-yellow-500/10", text: "text-yellow-600" },
    green: { border: "border-green-500/40", bg: "bg-green-500/10", text: "text-green-600" },
    red: { border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-600" },
    purple: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-600" },
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
          {color === "blue" && <Package className="h-5 w-5" />}
          {color === "yellow" && <Clock className="h-5 w-5" />}
          {color === "purple" && <Truck className="h-5 w-5" />}
          {color === "green" && <CheckCircle2 className="h-5 w-5" />}
          {color === "red" && <XCircle className="h-5 w-5" />}
        </div>
      </div>
    </div>
  )
}

interface ShipmentStatsCardsProps {
  total: number
  pending: number
  in_transit: number
  delivered: number
  cancelled: number
}

export function ShipmentStatsCards({
  total,
  pending,
  in_transit,
  delivered,
  cancelled,
}: ShipmentStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <StatCard title="Total" value={total} color="blue" />
      <StatCard title="Pending" value={pending} color="yellow" />
      <StatCard title="In Transit" value={in_transit} color="purple" />
      <StatCard title="Delivered" value={delivered} color="green" />
      <StatCard title="Cancelled" value={cancelled} color="red" />
    </div>
  )
}
