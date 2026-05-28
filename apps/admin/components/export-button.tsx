'use client'

import { useState } from "react"
import { FileDownIcon, Loader2Icon, FileTextIcon, BarChart3Icon, RouteIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Column {
  key: string
  header: string
}

export interface Section {
  title: string
  data: unknown[]
  columns: Column[]
}

export interface ExportButtonProps {
  sections: Section[]
  filename?: string
  organisation?: {
    name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
    countryCode?: string
  }
  branch?: {
    name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
  }
  stats?: {
    shipments: { total: number; pending: number; in_transit: number; delivered: number; cancelled: number; deliveryRate: number; avgTransitDays: number }
    quotes: { total: number; converted: number; conversionRate: number; avgValue: number }
    invoices: { totalRevenue: number; avgInvoiceAmount: number; invoiceCount: number }
  }
  chartData?: { date: string; shipments: number; quotes: number; delivered: number; revenue: number }[]
}

function currency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function buildReportHtml(
  sections: Section[],
  stats: ExportButtonProps['stats'],
  chartData: ExportButtonProps['chartData'],
  org: ExportButtonProps['organisation'],
  branch: ExportButtonProps['branch'],
  title: string,
  mode: 'full' | 'routes' | 'carriers' = 'full',
): string {
  const orgName = org?.name?.toUpperCase() || title.split('-')[0].toUpperCase()
  const orgEmail = org?.email || ''
  const orgPhone = org?.phone || ''
  const orgAddr = [org?.address, org?.city, org?.state, org?.postalCode].filter(Boolean).join(', ')
  const branchName = branch?.name || ''
  const branchAddr = [branch?.address, branch?.city, branch?.state, branch?.postalCode].filter(Boolean).join(', ')
  const branchEmail = branch?.email || ''
  const branchPhone = branch?.phone || ''

  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  const period = title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const totalRevenue = stats?.invoices.totalRevenue ?? 0
  const filteredSections = mode === 'routes'
    ? sections.filter(s => s.title === 'Top Routes')
    : mode === 'carriers'
    ? sections.filter(s => s.title === 'Carrier Performance')
    : sections

  return `<!DOCTYPE html>
<html>
<head>
  <title>${period} Report</title>
  <style>
    @page { margin: 0.8in 1in; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: #1e293b; padding: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; }
    .org-details { }
    .org-name { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .org-info { font-size: 9px; color: #64748b; margin-top: 4px; line-height: 1.6; }
    .report-meta { text-align: right; font-size: 9px; color: #64748b; }
    .report-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
    .report-period { font-size: 11px; color: #64748b; margin-bottom: 20px; }
    .stats-grid { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat-card { flex: 1; min-width: 120px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; background: #f8fafc; }
    .stat-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; }
    .stat-value { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .stat-sub { font-size: 8px; color: #94a3b8; margin-top: 1px; }
    h2 { font-size: 13px; font-weight: 700; color: #0f172a; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 16px; }
    th, td { border: 1px solid #e2e8f0; padding: 5px 7px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    tr:nth-child(even) { background: #fafafa; }
    .text-right { text-align: right; }
    .text-muted { color: #94a3b8; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-details">
      <div class="org-name">${orgName}</div>
      <div class="org-info">
        ${orgAddr}${orgPhone ? '<br/>' + orgPhone : ''}${orgEmail ? '<br/>' + orgEmail : ''}
        ${branchName ? '<br/><br/><strong>' + branchName + '</strong>' : ''}
        ${branchAddr ? '<br/>' + branchAddr : ''}
        ${branchPhone ? '<br/>' + branchPhone : ''}
        ${branchEmail ? '<br/>' + branchEmail : ''}
      </div>
    </div>
    <div class="report-meta">
      <div class="report-title">Report</div>
      <div>${period}</div>
      <div style="margin-top:8px;">Generated: ${dateLabel}</div>
    </div>
  </div>

  <div class="report-period">Summary for the period of ${period}</div>

  ${mode === 'full' ? `<div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Shipments</div>
      <div class="stat-value">${stats?.shipments.total ?? 0}</div>
      <div class="stat-sub">All shipments</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Delivered</div>
      <div class="stat-value">${stats?.shipments.delivered ?? 0}</div>
      <div class="stat-sub">${Math.round(stats?.shipments.avgTransitDays ?? 0)} days avg</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Delivery Rate</div>
      <div class="stat-value">${Math.round((stats?.shipments.deliveryRate ?? 0) * 100)}%</div>
      <div class="stat-sub">Successful rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Revenue</div>
      <div class="stat-value">${currency(totalRevenue)}</div>
      <div class="stat-sub">${stats?.invoices.invoiceCount ?? 0} invoices</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Invoice</div>
      <div class="stat-value">${currency(stats?.invoices.avgInvoiceAmount ?? 0)}</div>
      <div class="stat-sub">Per invoice</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Quotes</div>
      <div class="stat-value">${stats?.quotes.total ?? 0}</div>
      <div class="stat-sub">${((stats?.quotes.conversionRate ?? 0) * 100).toFixed(0)}% conversion</div>
    </div>
  </div>

  ${chartData && chartData.length > 0 ? `
  <h2>Daily Trend</h2>
  <table>
    <thead><tr><th>Date</th><th class="text-right">Shipments</th><th class="text-right">Delivered</th><th class="text-right">Quotes</th><th class="text-right">Revenue (₹)</th></tr></thead>
    <tbody>
      ${chartData.map(d => `<tr>
        <td>${d.date}</td>
        <td class="text-right">${d.shipments}</td>
        <td class="text-right">${d.delivered}</td>
        <td class="text-right">${d.quotes}</td>
        <td class="text-right">${d.revenue.toLocaleString('en-IN')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ` : ''}` : ''}

  ${filteredSections.map(section => `
    <h2>${section.title}</h2>
    <table>
      <thead><tr>${section.columns.map(c => `<th>${c.header}</th>`).join('')}</tr></thead>
      <tbody>
        ${section.data.length === 0
          ? `<tr><td colspan="${section.columns.length}" class="text-muted" style="text-align:center;padding:16px;">No data</td></tr>`
          : section.data.map((row: unknown) => `<tr>${section.columns.map(c => {
              const val = (row as { [key: string]: unknown })[c.key]
              const display = val === null || val === undefined ? '' : String(val)
              return `<td>${display}</td>`
            }).join('')}</tr>`).join('')
        }
      </tbody>
    </table>
  `).join('')}

  <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); }</script>
</body>
</html>`
}

function downloadPdfReport(html: string) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
}

export function ExportButton({ sections, filename = "report", organisation, branch, stats, chartData }: ExportButtonProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = (mode: 'full' | 'routes' | 'carriers') => {
    setLoading(mode)
    try {
      const html = buildReportHtml(sections, stats, chartData, organisation, branch, filename, mode)
      downloadPdfReport(html)
    } finally {
      setLoading(null)
    }
  }

  const hasRoutes = sections.some(s => s.title === 'Top Routes' && s.data.length > 0)
  const hasCarriers = sections.some(s => s.title === 'Carrier Performance' && s.data.length > 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading !== null}>
          {loading ? (
            <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileDownIcon className="h-4 w-4 mr-2" />
          )}
          {loading ? "Generating..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => handleExport('full')}>
          <FileTextIcon className="h-4 w-4 mr-2" />
          Full Report (PDF)
        </DropdownMenuItem>
        {hasRoutes && (
          <DropdownMenuItem onClick={() => handleExport('routes')}>
            <RouteIcon className="h-4 w-4 mr-2" />
            Top Routes (PDF)
          </DropdownMenuItem>
        )}
        {hasCarriers && (
          <DropdownMenuItem onClick={() => handleExport('carriers')}>
            <BarChart3Icon className="h-4 w-4 mr-2" />
            Carrier Performance (PDF)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
