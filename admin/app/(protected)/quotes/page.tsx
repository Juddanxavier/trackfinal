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
  ExternalLinkIcon,
  SaveIcon,
  MailIcon,
  TrashIcon,
  EyeIcon,
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
import { ExportButton } from "@/components/export-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

type QuoteStatus = "pending" | "quoted" | "accepted" | "rejected"

interface Quote {
  id: string
  email: string
  phone?: string
  originCountry: string
  destinationCountry: string
  status: QuoteStatus
  goodsType?: string
  weight?: string
  price?: string
  remarks?: string
  createdAt: string
  updatedAt: string
  [key: string]: unknown
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

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [editStatus, setEditStatus] = useState<QuoteStatus>("pending")
  const [editPrice, setEditPrice] = useState("")
  const [editRemarks, setEditRemarks] = useState("")
  const [saving, setSaving] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [lastSentTime, setLastSentTime] = useState<number>(0)
  const EMAIL_COOLDOWN = 60000

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return
    try {
      await api.delete(`/quotes/${id}`)
      fetchQuotes()
      const statsRes = await api.get<Stats>(`/quotes/stats${selectedOrganisation ? `?organisationId=${selectedOrganisation}` : ""}`)
      setStats(statsRes)
    } catch (err) {
      console.error("Failed to delete quote:", err)
    }
  }

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote)
    setEditStatus(quote.status)
    setEditPrice(quote.price || "")
    setEditRemarks(quote.remarks || "")
    setSheetOpen(true)
  }

  const handleSaveChanges = async () => {
    if (!selectedQuote) return

    setSaving(true)
    try {
      await api.patch(`/quotes/${selectedQuote.id}`, {
        status: editStatus,
        price: editPrice || null,
        remarks: editRemarks || null,
      })
      setSheetOpen(false)
      fetchQuotes()
      const statsRes = await api.get<Stats>(`/quotes/stats${selectedOrganisation ? `?organisationId=${selectedOrganisation}` : ""}`)
      setStats(statsRes)
    } catch (err) {
      console.error("Failed to update quote:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleExportToGoogleSheets = async () => {
    if (!selectedQuote) return

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/create?usp=sharing`
    window.open(spreadsheetUrl, "_blank")
  }

  const handleOpenEmailDialog = (quote: Quote) => {
    setSelectedQuote(quote)
    setEmailSubject(`Quote Update - Track Logistics`)
    setEmailMessage("")
    setEmailDialogOpen(true)
  }

  const handleSendEmail = () => {
    const now = Date.now()
    if (now - lastSentTime < EMAIL_COOLDOWN) {
      return
    }
    setConfirmDialogOpen(true)
  }

  const handleConfirmSend = async () => {
    if (!selectedQuote) return

    setSendingEmail(true)
    setLastSentTime(Date.now())
    setConfirmDialogOpen(false)
    try {
      await api.post(`/quotes/${selectedQuote.id}/send-email`, {
        subject: emailSubject,
        message: emailMessage,
      })
      setEmailDialogOpen(false)
    } catch (err) {
      console.error("Failed to send email:", err)
    } finally {
      setSendingEmail(false)
    }
  }

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

      <div className="flex justify-end mb-4">
        <ExportButton
          data={quotes}
          columns={[
            { key: "email", header: "Email" },
            { key: "originCountry", header: "Origin" },
            { key: "destinationCountry", header: "Destination" },
            { key: "status", header: "Status" },
            { key: "price", header: "Price" },
            { key: "createdAt", header: "Created" },
          ]}
          filename="quotes"
        />
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox /></TableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>email</SortableTableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>phone</SortableTableHead>
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
                <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
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
                  <TableCell>{quote.phone || "-"}</TableCell>
                  <TableCell>{quote.originCountry}</TableCell>
                  <TableCell>{quote.destinationCountry}</TableCell>
                  <TableCell>
                    <Badge className={variants[quote.status]}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{quote.price ? `₹${Math.round(parseFloat(quote.price)).toLocaleString('en-IN')}` : "-"}</TableCell>
                  <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-auto">
                        <DropdownMenuItem onClick={() => handleViewDetails(quote)}>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {quote.status !== "accepted" && quote.status !== "rejected" && (
                          <DropdownMenuItem onClick={() => handleOpenEmailDialog(quote)}>
                            <MailIcon className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(quote.id)} className="text-red-600">
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <tr>
              <td colSpan={9} className="px-4 py-3 text-sm text-muted-foreground">
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto p-6">
          <SheetHeader>
            <SheetTitle>Quote Details</SheetTitle>
            <SheetDescription>
              View and update quote information
            </SheetDescription>
          </SheetHeader>

          {selectedQuote && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedQuote.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedQuote.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Origin</Label>
                  <p className="font-medium">{selectedQuote.originCountry}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destination</Label>
                  <p className="font-medium">{selectedQuote.destinationCountry}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Goods Type</Label>
                  <p className="font-medium">{selectedQuote.goodsType || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Weight</Label>
                  <p className="font-medium">{selectedQuote.weight || "-"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground mb-2 block">Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as QuoteStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Price</Label>
                <Input
                  type="text"
                  placeholder="Enter price"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Remarks</Label>
                <Textarea
                  placeholder="Add remarks..."
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveChanges} disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground mb-2 block">Created</Label>
                <p className="text-sm">{new Date(selectedQuote.createdAt).toLocaleString()}</p>
                {selectedQuote.updatedAt !== selectedQuote.createdAt && (
                  <>
                    <Label className="text-muted-foreground mt-2 block">Last Updated</Label>
                    <p className="text-sm">{new Date(selectedQuote.updatedAt).toLocaleString()}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send a custom email to {selectedQuote?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Input value={selectedQuote?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter subject..."
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Send Email</DialogTitle>
            <DialogDescription>
              Send email to {selectedQuote?.email}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">Subject: {emailSubject}</p>
            <p className="text-sm text-muted-foreground line-clamp-3">Message preview: {emailMessage}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSend} disabled={sendingEmail}>
              {sendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Confirm Send"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}