'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2Icon, InfoIcon } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from "recharts"
import { ExportButton } from "@/components/export-button"
import { ReportStatsCards } from "@/components/report-stats-cards"

type DateRange = "7d" | "30d" | "90d"

interface ReportStats {
  shipments: { total: number; pending: number; in_transit: number; delivered: number; cancelled: number; deliveryRate: number; avgTransitDays: number }
  quotes: { total: number; converted: number; conversionRate: number; avgValue: number }
  invoices: { totalRevenue: number; avgInvoiceAmount: number; invoiceCount: number }
}

interface ChartDataPoint { date: string; shipments: number; quotes: number; delivered: number; revenue: number }
interface RouteData { origin: string; destination: string; count: number }
interface CarrierData { carrier: string; total: number; delivered: number; deliveryRate: number; avgDays: number }
interface OrgInfo { id: string; name: string; email?: string; phone?: string; address?: string; city?: string; state?: string; postalCode?: string; countryCode?: string }
interface BranchInfo { id: string; name: string; email?: string; phone?: string; address?: string; city?: string; state?: string; postalCode?: string }

const chartConfig = {
  shipments: { label: "Shipments", color: "hsl(217 91% 60%)" },
  delivered: { label: "Delivered", color: "hsl(142 71% 45%)" },
}

const PIE_COLORS = ["hsl(38 92% 50%)", "hsl(245 58% 51%)", "hsl(142 71% 45%)", "hsl(0 84% 58%)"]

export default function ReportsPage() {
  const { selectedOrganisation, user } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [routeData, setRouteData] = useState<RouteData[]>([])
  const [carrierData, setCarrierData] = useState<CarrierData[]>([])
  const [organisation, setOrganisation] = useState<OrgInfo | undefined>(undefined)
  const [branch, setBranch] = useState<BranchInfo | undefined>(undefined)
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [branchId, setBranchId] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === "staff" && user?.branchId) {
      setBranchId(user.branchId)
    }
  }, [user])

  useEffect(() => {
    if (!selectedOrganisation) return
    api.get<{ id: string; name: string }[]>(`/organisations/${selectedOrganisation}/branches`).then(setBranches).catch(() => {})
  }, [selectedOrganisation])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    let url = `/reports/summary?range=${dateRange}`
    if (selectedOrganisation) url += `&organisationId=${selectedOrganisation}`
    if (branchId && branchId !== "all") url += `&branchId=${branchId}`
    api
      .get<{
        stats: ReportStats
        chartData: ChartDataPoint[]
        routes: RouteData[]
        carriers: CarrierData[]
        organisation?: OrgInfo
        branch?: BranchInfo
      }>(url)
      .then((res) => {
        if (ignore) return
        setStats(res.stats)
        setChartData(res.chartData)
        setRouteData(res.routes)
        setCarrierData(res.carriers)
        setOrganisation(res.organisation)
        setBranch(res.branch)
        setLoading(false)
      })
      .catch(() => {
        setStats({ shipments: { total: 0, pending: 0, in_transit: 0, delivered: 0, cancelled: 0, deliveryRate: 0, avgTransitDays: 0 }, quotes: { total: 0, converted: 0, conversionRate: 0, avgValue: 0 }, invoices: { totalRevenue: 0, avgInvoiceAmount: 0, invoiceCount: 0 } })
        setChartData([])
        setRouteData([])
        setCarrierData([])
        setLoading(false)
      })
    return () => { ignore = true }
  }, [dateRange, selectedOrganisation, branchId])

  const pieData = [
    { name: "Pending", value: stats?.shipments.pending ?? 0, desc: "Shipments awaiting pickup or processing" },
    { name: "In Transit", value: stats?.shipments.in_transit ?? 0, desc: "Currently being transported" },
    { name: "Delivered", value: stats?.shipments.delivered ?? 0, desc: "Successfully delivered to recipient" },
    { name: "Cancelled", value: stats?.shipments.cancelled ?? 0, desc: "Cancelled or returned shipments" },
  ].filter(d => d.value > 0)

  const exportSections = [
    {
      title: "Top Routes",
      data: routeData,
      columns: [
        { key: "origin", header: "Origin" },
        { key: "destination", header: "Destination" },
        { key: "count", header: "Count" },
      ],
    },
    {
      title: "Carrier Performance",
      data: carrierData,
      columns: [
        { key: "carrier", header: "Carrier" },
        { key: "total", header: "Total" },
        { key: "delivered", header: "Delivered" },
        { key: "deliveryRate", header: "Rate" },
        { key: "avgDays", header: "Avg Days" },
      ],
    },
  ]

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">Analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            {user?.role !== "staff" && branches.length > 0 && (
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All Branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <ExportButton
              sections={exportSections}
              filename={`report-${dateRange}`}
              organisation={organisation}
              branch={branch}
              stats={stats ?? undefined}
              chartData={chartData}
            />
          </div>
        </div>

        <ReportStatsCards stats={stats} />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">Shipments Trend</CardTitle>
                <CardDescription>Shipments over time</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger><InfoIcon className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Shows total shipments vs delivered each day over the selected period.</p>
                  <p className="text-xs mt-1 text-muted-foreground">Blue = Total | Green = Delivered</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <ChartLegendContent />
                  <Area type="monotone" dataKey="shipments" stroke="hsl(217 91% 60%)" fillOpacity={1} fill="url(#colorShipments)" strokeWidth={2} name="Total Shipments" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "white" }} />
                  <Area type="monotone" dataKey="delivered" stroke="hsl(142 71% 45%)" fillOpacity={1} fill="url(#colorDelivered)" strokeWidth={2} name="Delivered" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "white" }} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">Status</CardTitle>
                <CardDescription>Current breakdown</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger><InfoIcon className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Distribution of all shipments by current status.</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} cornerRadius={4} dataKey="value" nameKey="name">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-2 mt-4">
                {pieData.map((item, i) => (
                  <Tooltip key={item.name}>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">
                        <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: PIE_COLORS[i] }} />
                        {item.name}: {item.value}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>{item.desc}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">Top Routes</CardTitle>
                <CardDescription>Most popular origin-destination pairs</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger><InfoIcon className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Top shipping routes by number of shipments in the selected period.</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routeData.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
                  ) : (
                    routeData.slice(0, 8).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.origin || "Unknown"}</TableCell>
                        <TableCell>{r.destination || "Unknown"}</TableCell>
                        <TableCell className="text-right font-medium">{r.count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">Carrier Performance</CardTitle>
                <CardDescription>Deliveries by carrier</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger><InfoIcon className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Carrier delivery performance showing total shipments vs successful deliveries.</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <BarChart data={carrierData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="carrier" tick={{ fontSize: 12 }} width={75} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <ChartLegendContent />
                  <Bar dataKey="delivered" fill="hsl(142 71% 45%)" name="Delivered" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
