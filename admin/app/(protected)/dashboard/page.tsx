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
  shipments: { label: "Shipments", color: "hsl(var(--primary))" },
  quotes: { label: "Quotes", color: "hsl(var(--accent))" },
} satisfies Record<string, { label?: string; color?: string }>

const BLUE = "hsl(var(--primary))"
const PURPLE = "hsl(var(--accent))"
const GREEN = "hsl(142.1 76.2% 36.3%)"
const AMBER = "hsl(48 96% 53%)"
const RED = "hsl(0 84.2% 60.2%)"

const SHIPMENT_COLORS = [AMBER, BLUE, GREEN, RED]
const QUOTE_COLORS = [AMBER, PURPLE, GREEN, RED]

const generateSparklineData = (value: number) => {
  const base = Math.max(1, Math.floor(value / 3))
  return Array.from({ length: 7 }, () => ({
    value: Math.max(0, base + Math.floor(Math.random() * base) - Math.floor(base / 2))
  }))
}

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  icon: React.ReactNode
  color: string
  borderColor: string
  sparkData?: { value: number }[]
}

function StatCard({ title, value, subtitle, icon, color, borderColor, sparkData }: StatCardProps) {
  const addAlpha = (hex: string, alpha: number) => {
    return `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${alpha})`
  }

  return (
    <Card className={`p-5 border-t-4 ${borderColor} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: addAlpha(color, 0.15) }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      {subtitle && (
        <div className="mt-2 flex items-center text-xs text-muted-foreground">
          {subtitle}
        </div>
      )}
      {sparkData && (
        <div className="mt-3 -mx-2">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id={`sp-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#sp-${title.replace(/\s/g, '')})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

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
          console.log("[Dashboard] Shipment stats:", shipRes)
          setShipmentStats(shipRes)
        }
        if (quoteRes) {
          console.log("[Dashboard] Quote stats:", quoteRes)
          setQuoteStats(quoteRes)
        }

        const [shipActivity, quoteActivity, destinations] = await Promise.all([
          api.get<{ date: string; shipments: number }[]>(`/shipments/activity?organisationId=${selectedOrganisation}&days=14`, { throwOnError: false }),
          api.get<{ date: string; quotes: number }[]>(`/quotes/activity?organisationId=${selectedOrganisation}&days=14`, { throwOnError: false }),
          api.get<{ country: string; count: number }[]>(`/shipments/destinations?organisationId=${selectedOrganisation}&limit=5`, { throwOnError: false }),
        ])

        console.log("[Dashboard] Ship activity:", shipActivity)
        console.log("[Dashboard] Quote activity:", quoteActivity)

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
          const count = (s as any).shipments ?? (s as any).total ?? 0
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

        console.log("[Dashboard] Combined activity:", combined)

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Shipments"
          value={shipmentStats?.total || 0}
          subtitle={`${shipmentStats?.recent || 0} new this week`}
          icon={<Package className="h-5 w-5" />}
          color="#3b82f6"
          borderColor="border-t-blue-500"
          sparkData={generateSparklineData(shipmentStats?.total || 0)}
        />
        <StatCard
          title="In Transit"
          value={shipmentStats?.in_transit || 0}
          subtitle="Active shipments"
          icon={<Truck className="h-5 w-5" />}
          color="#6366f1"
          borderColor="border-t-indigo-500"
          sparkData={generateSparklineData(shipmentStats?.in_transit || 0)}
        />
        <StatCard
          title="Total Quotes"
          value={quoteStats?.total || 0}
          subtitle={`${quoteStats?.recent || 0} new this week`}
          icon={<FileText className="h-5 w-5" />}
          color="#a855f7"
          borderColor="border-t-purple-500"
          sparkData={generateSparklineData(quoteStats?.total || 0)}
        />
        <StatCard
          title="Accepted"
          value={quoteStats?.accepted || 0}
          subtitle={`${quoteStats?.rejected || 0} rejected`}
          icon={<CheckCircle className="h-5 w-5" />}
          color="#22c55e"
          borderColor="border-t-green-500"
          sparkData={generateSparklineData(quoteStats?.accepted || 0)}
        />
      </div>

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
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradientQuotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} className="stroke-muted/50" />
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
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="shipments"
                  fill="url(#gradientShipments)"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="quotes"
                  fill="url(#gradientQuotes)"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
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