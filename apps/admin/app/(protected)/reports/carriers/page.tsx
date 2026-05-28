'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-context'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AnimatedPage } from '@/components/animated-page'
import { Loader2Icon, TrendingUpIcon, AlertTriangleIcon, TruckIcon } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts'

interface CarrierTrend {
  month: string
  total: number
  delivered: number
  deliveryRate: number
}

interface CarrierAnalytic {
  carrier: string
  total: number
  delivered: number
  exceptionCount: number
  deliveryRate: number
  exceptionRate: number
  onTimeRate: number
  avgDays: number
  p50: number
  p90: number
  trend: CarrierTrend[]
}

interface CarrierAnalyticsResult {
  carriers: CarrierAnalytic[]
  summary: {
    bestPerformer: string
    worstPerformer: string
    overallOnTimeRate: number
    avgTransitDays: number
  }
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

function days(v: number) {
  return `${v.toFixed(1)}d`
}

export default function CarrierAnalyticsPage() {
  const { selectedOrganisation } = useAuth()
  const [data, setData] = useState<CarrierAnalyticsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('90d')
  const [slaDays, setSlaDays] = useState('7')
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    let url = `/reports/carrier-analytics?range=${dateRange}&slaDays=${slaDays}`
    if (selectedOrganisation) url += `&organisationId=${selectedOrganisation}`
    api.get<CarrierAnalyticsResult>(url).then((res) => {
      if (ignore) return
      setData(res)
      setLoading(false)
    }).catch(() => {
      setData(null)
      setLoading(false)
    })
    return () => { ignore = true }
  }, [dateRange, slaDays, selectedOrganisation])

  const selectedCarrierData = selectedCarrier
    ? data?.carriers.find((c) => c.carrier === selectedCarrier)
    : null

  return (
    <AnimatedPage className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carrier Analytics</h1>
          <p className="text-sm text-muted-foreground">Performance metrics and trends per carrier</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="sla" className="text-xs whitespace-nowrap">SLA (days)</Label>
            <Input
              id="sla"
              type="number"
              className="w-16 h-8"
              value={slaDays}
              onChange={(e) => setSlaDays(e.target.value)}
              min={1}
              max={30}
            />
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          No data available
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">On-Time Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pct(data.summary.overallOnTimeRate)}</div>
                <p className="text-xs text-muted-foreground">Within {slaDays}-day SLA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Transit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{days(data.summary.avgTransitDays)}</div>
                <p className="text-xs text-muted-foreground">Across all carriers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Best Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.summary.bestPerformer}</div>
                <p className="text-xs text-muted-foreground">Highest on-time rate (min 5 delivered)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Worst Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{data.summary.worstPerformer}</div>
                <p className="text-xs text-muted-foreground">Lowest on-time rate (min 5 delivered)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5" />
                Carrier Comparison
              </CardTitle>
              <CardDescription>
                Click a row to view monthly trend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carrier</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Del. Rate</TableHead>
                    <TableHead className="text-right">On-Time</TableHead>
                    <TableHead className="text-right">Exceptions</TableHead>
                    <TableHead className="text-right">Avg Days</TableHead>
                    <TableHead className="text-right">P50</TableHead>
                    <TableHead className="text-right">P90</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.carriers.map((c) => (
                    <TableRow
                      key={c.carrier}
                      className={`cursor-pointer ${selectedCarrier === c.carrier ? 'bg-muted' : ''}`}
                      onClick={() => setSelectedCarrier(selectedCarrier === c.carrier ? null : c.carrier)}
                    >
                      <TableCell className="font-medium">{c.carrier}</TableCell>
                      <TableCell className="text-right">{c.total}</TableCell>
                      <TableCell className="text-right">{c.delivered}</TableCell>
                      <TableCell className="text-right">{pct(c.deliveryRate)}</TableCell>
                      <TableCell className="text-right">{pct(c.onTimeRate)}</TableCell>
                      <TableCell className="text-right">
                        <span className={c.exceptionRate > 0.1 ? 'text-red-600' : ''}>
                          {pct(c.exceptionRate)} ({c.exceptionCount})
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{days(c.avgDays)}</TableCell>
                      <TableCell className="text-right">{days(c.p50)}</TableCell>
                      <TableCell className="text-right">{days(c.p90)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedCarrierData && selectedCarrierData.trend.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="h-5 w-5" />
                  {selectedCarrierData.carrier} — Delivery Rate Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedCarrierData.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 1]} tickFormatter={(v: number) => pct(v)} />
                    <Tooltip formatter={(value: number) => pct(value)} />
                    <Line type="monotone" dataKey="deliveryRate" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5" />
                Exception Rate Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.carriers.filter(c => c.exceptionCount > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="carrier" />
                  <YAxis domain={[0, 1]} tickFormatter={(v: number) => pct(v)} />
                  <Tooltip formatter={(value: number) => pct(value)} />
                  <Bar dataKey="exceptionRate" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </AnimatedPage>
  )
}
