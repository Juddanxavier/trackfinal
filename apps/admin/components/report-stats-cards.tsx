"use client"

import {
  TruckIcon,
  CheckCircleIcon,
  CircleDotIcon,
  FileTextIcon,
  DollarSignIcon,
  ReceiptIcon,
} from "lucide-react"
import { StatsCard } from "@/components/stats-card"

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
  invoices: {
    totalRevenue: number
    avgInvoiceAmount: number
    invoiceCount: number
  }
}

interface ReportStatsCardsProps {
  stats?: ReportStats | null
}

export function ReportStatsCards({ stats }: ReportStatsCardsProps) {
  const currency = (n: number) =>
    `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-12">
      <div className="col-span-2 md:col-span-8">
        <StatsCard
          title="Total Shipments"
          value={stats?.shipments.total ?? 0}
          subtitle="All shipments in period"
          icon={<TruckIcon className="h-4 w-4" />}
          color="blue"
        />
      </div>

      <div className="col-span-2 md:col-span-4">
        <StatsCard
          title="Delivered"
          value={stats?.shipments.delivered ?? 0}
          subtitle={`${Math.round(stats?.shipments.avgTransitDays ?? 0)} days avg`}
          icon={<CheckCircleIcon className="h-4 w-4" />}
          color="emerald"
        />
      </div>

      <div className="col-span-1 md:col-span-3">
        <StatsCard
          title="Delivery Rate"
          value={`${Math.round((stats?.shipments.deliveryRate ?? 0) * 100)}%`}
          subtitle="Successful rate"
          icon={<CircleDotIcon className="h-4 w-4" />}
          color="amber"
        />
      </div>

      <div className="col-span-2 md:col-span-6">
        <StatsCard
          title="Total Revenue"
          value={currency(stats?.invoices.totalRevenue ?? 0)}
          subtitle={`${stats?.invoices.invoiceCount ?? 0} invoices billed`}
          icon={<DollarSignIcon className="h-4 w-4" />}
          color="green"
        />
      </div>

      <div className="col-span-1 md:col-span-3">
        <StatsCard
          title="Total Quotes"
          value={stats?.quotes.total ?? 0}
          subtitle={`${((stats?.quotes.conversionRate ?? 0) * 100).toFixed(0)}% conversion`}
          icon={<FileTextIcon className="h-4 w-4" />}
          color="purple"
        />
      </div>

      <div className="col-span-2 md:col-span-12">
        <StatsCard
          title="Avg Invoice"
          value={currency(stats?.invoices.avgInvoiceAmount ?? 0)}
          subtitle="Per invoice"
          icon={<ReceiptIcon className="h-4 w-4" />}
          color="indigo"
        />
      </div>
    </div>
  )
}
