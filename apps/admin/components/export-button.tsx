'use client'

import { useState } from "react"
import { FileDownIcon, FileSpreadsheetIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Column {
  key: string
  header: string
}

interface ExportButtonProps {
  data: unknown[]
  columns: Column[]
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
}

function convertToCSV(data: unknown[], columns: Column[]): string {
  const headers = columns.map(c => c.header)
  const rows = data.map((row: unknown) =>
    columns.map(c => {
      const val = (row as { [key: string]: unknown })[c.key]
      if (val === null || val === undefined) return ""
      if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`
      return String(val)
    }).join(",")
  )
  return [headers.join(), ...rows].join("\n")
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadPDF(data: unknown[], columns: Column[], filename: string, org?: ExportButtonProps['organisation']) {
  const headers = columns.map(c => c.header)
  const tableData = data.map((row: unknown) =>
    columns.map(c => {
      const val = (row as { [key: string]: unknown })[c.key]
      return val === null || val === undefined ? "" : String(val)
    })
  )

  const orgName = org?.name?.toUpperCase() || filename.split('-')[0].toUpperCase()
  const orgEmail = org?.email || 'contact@example.com'
  const orgPhone = org?.phone || ''
  const orgAddress = [org?.address, org?.city, org?.state, org?.postalCode].filter(Boolean).join(', ') || '123 Business Ave, City, ST 12345'

  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        @page { margin: 0.75in; size: letter; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; font-size: 11px; }
        .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
        .company-name { font-size: 20px; font-weight: 700; color: #1a1a1a; }
        .company-info { font-size: 10px; color: #666; text-align: right; line-height: 1.6; }
        h1 { font-size: 16px; font-weight: 600; margin: 16px 0 4px; }
        .meta { font-size: 10px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 16px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        tr:nth-child(even) { background: #fafafa; }
        .footer { position: fixed; bottom: 0.5in; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; }
        @media print { body { padding: 0; } .footer { position: fixed; } }
      </style>
    </head>
    <body>
      <div class="letterhead">
        <div>
          <div class="company-name">${orgName}</div>
          <div class="company-info">${orgAddress}${orgPhone ? '<br/>' + orgPhone : ''}${orgEmail ? '<br/>' + orgEmail : ''}</div>
        </div>
        <div style="text-align:right;font-size:10px;color:#666;">
          Generated: ${new Date().toLocaleDateString()}<br/>Page 1 of 1
        </div>
      </div>
      <h1>${filename.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h1>
      <div class="meta">Total records: ${data.length}</div>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${tableData.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleString()} | ${filename}</div>
      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 250); }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

export function ExportButton({ data, columns, filename = "export", organisation }: ExportButtonProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = (format: "csv" | "pdf") => {
    setLoading(format)
    try {
      if (!data || data.length === 0) {
        alert("No data to export")
        return
      }

      if (format === "csv") {
        const csv = convertToCSV(data, columns)
        downloadCSV(csv, filename)
      } else {
        downloadPDF(data, columns, filename, organisation)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading !== null}>
          {loading ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <FileDownIcon className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileDownIcon className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}