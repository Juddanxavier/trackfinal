"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api, ApiError } from "@/lib/api"
import { useRefetchOnFocus } from "@/lib/hooks/use-refetch-on-focus"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardStatsCards } from "@/components/dashboard-stats-cards"
import { EmptyState } from "@/components/empty-state"
import { Package, Plus } from "lucide-react"

interface Stats {
  total: number
  pending: number
  in_transit: number
  delivered: number
  cancelled: number
  recent: number
}

interface QuoteStats extends Stats {
  quoted: number
  accepted: number
  rejected: number
}

const CHART_CONFIG = {
  shipments: { label: "Shipments", color: "#3b82f6" },
  quotes: { label: "Quotes", color: "#22c55e" },
}

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  "In Transit": "#3b82f6",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
}

const QUOTE_STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Quoted: "#a855f7",
  Accepted: "#22c55e",
  Rejected: "#ef4444",
}

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
] as const

export default function DashboardPage() {
  const router = useRouter()
  const { selectedOrganisation, user } = useAuth()
  const [shipmentStats, setShipmentStats] = useState<Stats | null>(null)
  const [quoteStats, setQuoteStats] = useState<QuoteStats | null>(null)
  const [activityData, setActivityData] = useState<
    { date: string; shipments: number; quotes: number }[]
  >([])
  const [destinationData, setDestinationData] = useState<
    { country: string; count: number }[]
  >([])
  const [period, setPeriod] = useState(14)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!selectedOrganisation) {
      setLoading(false)
      return
    }
    if (fetchingRef.current) return
    fetchingRef.current = true
    const branchId = user?.role === "staff" ? user?.branchId : undefined
    const branchParam = branchId ? `&branchId=${branchId}` : ""

    try {
      const [shipRes, quoteRes] = await Promise.all([
        api.get<Stats>(
          `/shipments/stats?organisationId=${selectedOrganisation}${branchParam}`,
          { throwOnError: false }
        ),
        api.get<QuoteStats>(
          `/quotes/stats?organisationId=${selectedOrganisation}${branchParam}`,
          { throwOnError: false }
        ),
      ])

      if (shipRes) setShipmentStats(shipRes)
      if (quoteRes) setQuoteStats(quoteRes)

      const [shipActivity, quoteActivity, destinations] = await Promise.all([
        api.get<{ date: string; shipments: number }[]>(
          `/shipments/activity?organisationId=${selectedOrganisation}&days=${period}${branchParam}`,
          { throwOnError: false }
        ),
        api.get<{ date: string; quotes: number }[]>(
          `/quotes/activity?organisationId=${selectedOrganisation}&days=${period}${branchParam}`,
          { throwOnError: false }
        ),
        api.get<{ country: string; count: number }[]>(
          `/shipments/destinations?organisationId=${selectedOrganisation}&limit=5${branchParam}`,
          { throwOnError: false }
        ),
      ])

      const today = new Date()
      const dateMap = new Map<string, { shipments: number; quotes: number }>()

      for (let i = 0; i < period; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - (period - 1 - i))
        const dateStr = d.toISOString().split("T")[0]
        dateMap.set(dateStr, { shipments: 0, quotes: 0 })
      }

      shipActivity.forEach((s) => {
        const count = s.shipments ?? 0
        if (dateMap.has(s.date)) {
          dateMap.set(s.date, { ...dateMap.get(s.date)!, shipments: count })
        }
      })

      quoteActivity.forEach((q) => {
        if (dateMap.has(q.date)) {
          dateMap.set(q.date, {
            ...dateMap.get(q.date)!,
            quotes: q.quotes || 0,
          })
        }
      })

      const combined = Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, shipments: data.shipments, quotes: data.quotes }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setActivityData(combined)
      setDestinationData(destinations)
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [selectedOrganisation, period, router, user?.role, user?.branchId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRefetchOnFocus(fetchData, !loading)

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="mb-4 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="p-6">
              <Skeleton className="mb-4 h-5 w-40" />
              <Skeleton className="h-[320px]" />
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <Skeleton className="mb-4 h-5 w-32" />
              <Skeleton className="h-[320px]" />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const shipmentStatusData = [
    { name: "Pending", value: shipmentStats?.pending || 0 },
    { name: "In Transit", value: shipmentStats?.in_transit || 0 },
    { name: "Delivered", value: shipmentStats?.delivered || 0 },
    { name: "Cancelled", value: shipmentStats?.cancelled || 0 },
  ].filter((d) => d.value > 0)

  const quoteStatusData = [
    { name: "Pending", value: quoteStats?.pending || 0 },
    { name: "Quoted", value: quoteStats?.quoted || 0 },
    { name: "Accepted", value: quoteStats?.accepted || 0 },
    { name: "Rejected", value: quoteStats?.rejected || 0 },
  ].filter((d) => d.value > 0)

  const totalShipments = shipmentStats?.total || 0
  const totalQuotes = quoteStats?.total || 0

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const firstName = user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your logistics activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/shipments")}>
            <Package className="mr-1.5 size-3.5" />
            Shipments
          </Button>
          <Button size="sm" onClick={() => router.push("/shipments")}>
            <Plus className="mr-1.5 size-3.5" />
            New Shipment
          </Button>
        </div>
      </div>

      <DashboardStatsCards
        shipmentStats={shipmentStats}
        quoteStats={quoteStats}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base">Activity</CardTitle>
              <CardDescription>Shipments and quotes over time</CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setPeriod(opt.days)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === opt.days
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-6">
            {activityData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <EmptyState entity="generic" title="No activity data" description="Shipments and quotes activity will appear here." />
              </div>
            ) : (
              <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[300px] w-full">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="fillShipments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillQuotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(v) => {
                      const d = new Date(v)
                      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) =>
                          new Date(v).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        }
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="shipments"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#fillShipments)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "white", fill: "#3b82f6" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="quotes"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#fillQuotes)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "white", fill: "#22c55e" }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Quick Summary</CardTitle>
            <CardDescription>At a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Shipments</span>
                <span className="text-2xl font-bold">{totalShipments}</span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {shipmentStats?.pending || 0} pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {shipmentStats?.in_transit || 0} in transit
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {shipmentStats?.delivered || 0} delivered
                </span>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Quotes</span>
                <span className="text-2xl font-bold">{totalQuotes}</span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {quoteStats?.pending || 0} pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  {quoteStats?.quoted || 0} quoted
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {quoteStats?.accepted || 0} accepted
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-lg font-bold">
                {totalQuotes > 0
                  ? Math.round(((quoteStats?.accepted || 0) / totalQuotes) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Shipment Status</CardTitle>
            <CardDescription>Current distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {shipmentStatusData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center">
                <EmptyState entity="shipments" title="No shipment data" description="Shipment distribution will appear once shipments are created." />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ChartContainer config={CHART_CONFIG} className="h-[200px] w-[200px] shrink-0">
                  <PieChart>
                    <Pie
                      data={shipmentStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={56}
                      outerRadius={90}
                      paddingAngle={2}
                      cornerRadius={4}
                    >
                      {shipmentStatusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={SHIPMENT_STATUS_COLORS[entry.name] || "#888"}
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-3 self-center">
                  {shipmentStatusData.map((item) => {
                    const pct = Math.round((item.value / totalShipments) * 100)
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: SHIPMENT_STATUS_COLORS[item.name] }}
                        />
                        <span className="flex-1 text-sm text-muted-foreground">{item.name}</span>
                        <span className="text-sm font-semibold">{item.value}</span>
                        <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quote Status</CardTitle>
            <CardDescription>Current distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {quoteStatusData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center">
                <EmptyState entity="quotes" title="No quote data" description="Quote statistics will appear once quotes are created." />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ChartContainer config={CHART_CONFIG} className="h-[200px] w-[200px] shrink-0">
                  <PieChart>
                    <Pie
                      data={quoteStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={56}
                      outerRadius={90}
                      paddingAngle={2}
                      cornerRadius={4}
                    >
                      {quoteStatusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={QUOTE_STATUS_COLORS[entry.name] || "#888"}
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-3 self-center">
                  {quoteStatusData.map((item) => {
                    const pct = totalQuotes > 0 ? Math.round((item.value / totalQuotes) * 100) : 0
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: QUOTE_STATUS_COLORS[item.name] }}
                        />
                        <span className="flex-1 text-sm text-muted-foreground">{item.name}</span>
                        <span className="text-sm font-semibold">{item.value}</span>
                        <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Destinations</CardTitle>
          <CardDescription>Most frequent delivery locations</CardDescription>
        </CardHeader>
        <CardContent>
          {destinationData.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center">
              <EmptyState entity="generic" title="No destination data" description="Top shipping destinations will appear once tracked." />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <ChartContainer config={CHART_CONFIG} className="h-[220px] w-full">
                  <BarChart data={destinationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                    <YAxis
                      dataKey="country"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={140}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="var(--color-primary)" />
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="space-y-3">
                {destinationData.slice(0, 5).map((dest, i) => {
                  const maxCount = Math.max(...destinationData.map((d) => d.count))
                  return (
                    <div key={dest.country} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium">{dest.country}</span>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground">{dest.count}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(dest.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
