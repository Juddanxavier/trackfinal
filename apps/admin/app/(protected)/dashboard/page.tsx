'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api, ApiError } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, FileText, Truck, CheckCircle, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"
import { DashboardStatsCards } from "@/components/dashboard-stats-cards"

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
  visitors: { label: "Visitors" },
  shipments: { label: "Shipments", color: "#3b82f6" },
  quotes: { label: "Quotes", color: "#22c55e" },
} satisfies Record<string, { label?: string; color?: string }>

const SHIPMENT_COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444"]
const QUOTE_COLORS = ["#f59e0b", "#22c55e", "#a855f7", "#ef4444"]

export default function DashboardPage() {
  const router = useRouter()
  const { selectedOrganisation } = useAuth()
  const [shipmentStats, setShipmentStats] = useState<Stats | null>(null)
  const [quoteStats, setQuoteStats] = useState<QuoteStats | null>(null)
  const [activityData, setActivityData] = useState<{ date: string; shipments: number; quotes: number }[]>([])
  const [destinationData, setDestinationData] = useState<{ country: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedOrganisation) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const [shipRes, quoteRes] = await Promise.all([
          api.get<Stats>(`/shipments/stats?organisationId=${selectedOrganisation}`, { throwOnError: false }),
          api.get<QuoteStats>(`/quotes/stats?organisationId=${selectedOrganisation}`, { throwOnError: false }),
        ])

        if (shipRes) {
          setShipmentStats(shipRes)
        }
        if (quoteRes) {
          setQuoteStats(quoteRes)
        }

        const [shipActivity, quoteActivity, destinations] = await Promise.all([
          api.get<{ date: string; shipments: number }[]>(`/shipments/activity?organisationId=${selectedOrganisation}&days=14`, { throwOnError: false }),
          api.get<{ date: string; quotes: number }[]>(`/quotes/activity?organisationId=${selectedOrganisation}&days=14`, { throwOnError: false }),
          api.get<{ country: string; count: number }[]>(`/shipments/destinations?organisationId=${selectedOrganisation}&limit=5`, { throwOnError: false }),
        ])

        // Activity data loaded

        let combined: { date: string; shipments: number; quotes: number }[] = []

        const today = new Date()
        const dateMap = new Map<string, { shipments: number; quotes: number }>()

        for (let i = 0; i < 14; i++) {
          const d = new Date(today)
          d.setDate(d.getDate() - (13 - i))
          const dateStr = d.toISOString().split('T')[0]
          dateMap.set(dateStr, { shipments: 0, quotes: 0 })
        }

        shipActivity.forEach(s => {
          const count = s.shipments ?? 0
          if (dateMap.has(s.date)) {
            dateMap.set(s.date, { ...dateMap.get(s.date)!, shipments: count })
          }
        })

        quoteActivity.forEach(q => {
          if (dateMap.has(q.date)) {
            dateMap.set(q.date, { ...dateMap.get(q.date)!, quotes: q.quotes || 0 })
          }
        })

        combined = Array.from(dateMap.entries()).map(([date, data]) => ({
          date,
          shipments: data.shipments,
          quotes: data.quotes,
        })).sort((a, b) => a.date.localeCompare(b.date))

        setActivityData(combined)
        setDestinationData(destinations)
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          router.push("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedOrganisation, router])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6"><Skeleton className="h-[300px]" /></Card>
          <Card className="p-6"><Skeleton className="h-[300px]" /></Card>
        </div>
      </div>
    )
  }

  const shipmentStatusData = [
    { name: "Pending", value: shipmentStats?.pending || 0 },
    { name: "In Transit", value: shipmentStats?.in_transit || 0 },
    { name: "Delivered", value: shipmentStats?.delivered || 0 },
    { name: "Cancelled", value: shipmentStats?.cancelled || 0 },
  ].filter(d => d.value > 0)

  const quoteStatusData = [
    { name: "Pending", value: quoteStats?.pending || 0 },
    { name: "Quoted", value: quoteStats?.quoted || 0 },
    { name: "Accepted", value: quoteStats?.accepted || 0 },
    { name: "Rejected", value: quoteStats?.rejected || 0 },
  ].filter(d => d.value > 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your logistics activity</p>
      </div>

      <DashboardStatsCards shipmentStats={shipmentStats} quoteStats={quoteStats} />

      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Shipments and quotes over the last 14 days</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {activityData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No activity data available
            </div>
          ) : (
            <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[250px] w-full">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="gradientShipments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradientQuotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="shipments"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gradientShipments)"
                />
                <Area
                  type="monotone"
                  dataKey="quotes"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#gradientQuotes)"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shipment Status</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {shipmentStatusData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No shipment data
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ChartContainer config={CHART_CONFIG} className="h-[160px] w-[160px]">
                  <PieChart>
                    <Pie
                      data={shipmentStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {shipmentStatusData.map((_, i) => (
                        <Cell key={i} fill={SHIPMENT_COLORS[i % SHIPMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-2.5">
                  {shipmentStatusData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SHIPMENT_COLORS[i % SHIPMENT_COLORS.length] }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="p-6 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quote Status</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {quoteStatusData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No quote data
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ChartContainer config={CHART_CONFIG} className="h-[160px] w-[160px]">
                  <PieChart>
                    <Pie
                      data={quoteStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {quoteStatusData.map((_, i) => (
                        <Cell key={i} fill={QUOTE_COLORS[i % QUOTE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-2.5">
                  {quoteStatusData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: QUOTE_COLORS[i % QUOTE_COLORS.length] }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="p-6 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Destinations</CardTitle>
          <CardDescription>Most frequent delivery locations</CardDescription>
        </CardHeader>
        <CardContent>
          {destinationData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
              No destination data
            </div>
          ) : (
            <div className="space-y-4">
              {destinationData.slice(0, 5).map((dest, i) => (
                <div key={dest.country} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-6">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{dest.country}</span>
                      <span className="text-sm text-muted-foreground">{dest.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{ width: `${(dest.count / Math.max(...destinationData.map(d => d.count))) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}