"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { QuoteStatsCards } from "@/components/quote-stats-cards"
import { SearchTabs } from "@/components/search-tabs"
import { api } from "@/lib/api"
import {
  MoreHorizontalIcon,
  FileTextIcon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
  SortableTableHead,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Pagination } from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

type QuoteStatus = "pending" | "quoted" | "accepted" | "rejected"

interface Quote {
  id: string
  email: string
  originCountry: string
  destinationCountry: string
  status: QuoteStatus
  price?: string
  createdAt: string
}

interface Stats {
  total: number
  pending: number
  quoted: number
  accepted: number
  rejected: number
}

export default function QuotesPage() {
  const { selectedOrganisation } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortColumn, setSortColumn] = useState("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setSortColumn(column)
    setSortDirection(direction)
  }

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", limit.toString())
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (selectedOrganisation) params.set("organisationId", selectedOrganisation)
      if (sortColumn) {
        params.set("sortBy", sortColumn)
        params.set("sortOrder", sortDirection)
      }

      const res = await api.get<{ data: Quote[]; total: number; page: number; limit: number; totalPages: number }>(
        `/quotes?${params}`
      )
      setQuotes(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (err) {
      console.error("Failed to fetch quotes:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchQuotes()
  }, [search])

  useEffect(() => {
    fetchQuotes()
  }, [page, limit, statusFilter, selectedOrganisation, sortColumn, sortDirection])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = selectedOrganisation ? `?organisationId=${selectedOrganisation}` : ""
        const res = await api.get<Stats>(`/quotes/stats${params}`)
        setStats(res)
      } catch (err) {
        console.error("Failed to fetch stats:", err)
      }
    }
    fetchStats()
  }, [selectedOrganisation])

  const variants: Record<QuoteStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    quoted: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  const isFirstPage = page === 1
  const isLastPage = page === totalPages

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quote Management</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage all quote requests</p>
      </div>

      {stats && <QuoteStatsCards {...stats} />}

      <SearchTabs
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search quotes..."
        tabsValue={statusFilter}
        onTabsChange={setStatusFilter}
        tabs={[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "quoted", label: "Quoted" },
          { value: "accepted", label: "Accepted" },
          { value: "rejected", label: "Rejected" },
        ]}
      />

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox /></TableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>email</SortableTableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>originCountry</SortableTableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>destinationCountry</SortableTableHead>
              <TableHead>Status</TableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>price</SortableTableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>created</SortableTableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                <Empty>
                  <EmptyDescription>No quotes found</EmptyDescription>
                </Empty>
              </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell><Checkbox /></TableCell>
                  <TableCell>{quote.email}</TableCell>
                  <TableCell>{quote.originCountry}</TableCell>
                  <TableCell>{quote.destinationCountry}</TableCell>
                  <TableCell>
                    <Badge className={variants[quote.status]}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{quote.price || "-"}</TableCell>
                  <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <tr>
              <td colSpan={8} className="px-4 py-3 text-sm text-muted-foreground">
                Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} quotes
              </td>
            </tr>
          </TableFooter>
        </Table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        itemsPerPage={limit}
        onPageChange={setPage}
      />
    </div>
  )
}