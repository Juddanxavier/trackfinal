"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
  FileSpreadsheetIcon,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DataTable,
  RowCheckbox,
  SelectAllCheckbox,
  type ColumnDef,
  type SortingState,
} from "@/components/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/empty-state"
import { ExportButton } from "@/components/export-button"
import { toast } from "sonner"
import { AnimatedPage } from "@/components/animated-page"
import { useSocketRefresh } from "@/lib/hooks/use-socket-refresh"
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
import { ConfirmDialog } from "@/components/confirm-dialog"
import { BulkActionFooter } from "@/components/bulk-action-footer"
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
import {
  quoteEditSchema,
  quoteEmailSchema,
  type QuoteEditFormData,
  type QuoteEmailFormData,
} from "@/lib/validation"

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
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingEmailData, setPendingEmailData] =
    useState<QuoteEmailFormData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [lastSentTime, setLastSentTime] = useState<number>(0)
  const EMAIL_COOLDOWN = 60000

  const editForm = useForm<QuoteEditFormData>({
    resolver: zodResolver(quoteEditSchema),
  })
  const {
    handleSubmit: editHandleSubmit,
    control: editControl,
    register: editRegister,
    reset: editReset,
    formState: { errors: editErrors },
  } = editForm

  const emailForm = useForm<QuoteEmailFormData>({
    resolver: zodResolver(quoteEmailSchema),
    defaultValues: { subject: "Quote Update - Track Logistics", message: "" },
  })
  const {
    register: emailRegister,
    handleSubmit: emailHandleSubmit,
    reset: emailReset,
    formState: { errors: emailErrors },
  } = emailForm

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", limit.toString())
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (selectedOrganisation)
        params.set("organisationId", selectedOrganisation)
      if (sorting.length > 0) {
        params.set("sortBy", sorting[0].id)
        params.set("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const res = await api.get<{
        data: Quote[]
        total: number
        page: number
        limit: number
        totalPages: number
      }>(`/quotes?${params}`)
      setQuotes(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (err) {
      toast.error("Failed to fetch quotes")
    } finally {
      setLoading(false)
    }
  }

  useSocketRefresh("quotes", fetchQuotes, !loading)

  useEffect(() => {
    setPage(1)
    fetchQuotes()
  }, [search])

  useEffect(() => {
    fetchQuotes()
  }, [page, limit, statusFilter, selectedOrganisation, sorting])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = selectedOrganisation
          ? `?organisationId=${selectedOrganisation}`
          : ""
        const res = await api.get<Stats>(`/quotes/stats${params}`)
        setStats(res)
      } catch (err) {
        toast.error("Failed to fetch stats")
      }
    }
    fetchStats()
  }, [selectedOrganisation])

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/quotes/${deleteTarget}`)
      fetchQuotes()
      const statsRes = await api.get<Stats>(
        `/quotes/stats${selectedOrganisation ? `?organisationId=${selectedOrganisation}` : ""}`
      )
      setStats(statsRes)
    } catch (err) {
      toast.error("Failed to delete quote")
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote)
    editReset({
      status: quote.status,
      price: quote.price || "",
      remarks: quote.remarks || "",
    })
    setSheetOpen(true)
  }

  const onEditSubmit = async (data: QuoteEditFormData) => {
    if (!selectedQuote) return
    try {
      await api.patch(`/quotes/${selectedQuote.id}`, {
        status: data.status,
        price: data.price || null,
        remarks: data.remarks || null,
      })
      setSheetOpen(false)
      setSelectedQuote(null)
      fetchQuotes()
      const statsRes = await api.get<Stats>(
        `/quotes/stats${selectedOrganisation ? `?organisationId=${selectedOrganisation}` : ""}`
      )
      setStats(statsRes)
    } catch (err) {
      toast.error("Failed to update quote")
    }
  }

  const handleExportToGoogleSheets = async () => {
    const headers = [
      "Email",
      "Origin",
      "Destination",
      "Status",
      "Price",
      "Created",
    ]
    const rows = quotes.map((q) => [
      q.email,
      q.originCountry,
      q.destinationCountry,
      q.status,
      q.price?.toString() || "",
      q.createdAt,
    ])
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")
    try {
      await navigator.clipboard.writeText(csv)
      window.open(
        "https://docs.google.com/spreadsheets/d/create?usp=sharing",
        "_blank"
      )
      toast.success(
        "Data copied to clipboard. Paste into the new Google Sheet (Ctrl+V / Cmd+V)."
      )
    } catch {
      toast.error("Failed to copy data to clipboard")
    }
  }

  const handleOpenEmailDialog = (quote: Quote) => {
    setSelectedQuote(quote)
    emailReset({ subject: "Quote Update - Track Logistics", message: "" })
    setEmailDialogOpen(true)
  }

  const onEmailSubmit = (data: QuoteEmailFormData) => {
    const now = Date.now()
    if (now - lastSentTime < EMAIL_COOLDOWN) return
    setPendingEmailData(data)
    setConfirmDialogOpen(true)
  }

  const handleConfirmSend = async () => {
    if (!selectedQuote || !pendingEmailData) return
    setSendingEmail(true)
    setLastSentTime(Date.now())
    setConfirmDialogOpen(false)
    try {
      await api.post(`/quotes/${selectedQuote.id}/send-email`, {
        subject: pendingEmailData.subject,
        message: pendingEmailData.message,
      })
      setEmailDialogOpen(false)
      setPendingEmailData(null)
      toast.success("Email sent")
    } catch (err) {
      toast.error("Failed to send email")
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

  const columns: ColumnDef<Quote>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <SelectAllCheckbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
        />
      ),
      cell: ({ row }) => (
        <RowCheckbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "-",
      enableSorting: true,
    },
    {
      accessorKey: "originCountry",
      header: "Origin Country",
      enableSorting: true,
    },
    {
      accessorKey: "destinationCountry",
      header: "Destination Country",
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={variants[row.original.status]}>
          {row.original.status.charAt(0).toUpperCase() +
            row.original.status.slice(1)}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) =>
        row.original.price
          ? `₹${Math.round(parseFloat(row.original.price)).toLocaleString("en-IN")}`
          : "-",
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const quote = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
              >
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
              <DropdownMenuItem
                onClick={() => handleDeleteClick(quote.id)}
                className="text-red-600"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
    },
  ]

  return (
    <AnimatedPage className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quote Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all quote requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportToGoogleSheets}>
            <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
            Export to Sheets
          </Button>
          <ExportButton
            sections={[
              {
                title: "Quotes",
                data: quotes,
                columns: [
                  { key: "email", header: "Email" },
                  { key: "originCountry", header: "Origin" },
                  { key: "destinationCountry", header: "Destination" },
                  { key: "status", header: "Status" },
                  { key: "price", header: "Price" },
                  { key: "createdAt", header: "Created" },
                ],
              },
            ]}
            filename="quotes"
          />
        </div>
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

      <DataTable
        columns={columns}
        data={quotes}
        loading={loading}
        getRowId={(row) => row.id}
        emptyState={<EmptyState entity="quotes" />}
        renderMobileCard={(quote) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{quote.email}</span>
              <Badge className={variants[quote.status]}>
                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {quote.originCountry} → {quote.destinationCountry}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {quote.price
                  ? `₹${Math.round(parseFloat(quote.price)).toLocaleString("en-IN")}`
                  : "-"}
              </span>
              <span>{new Date(quote.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
        enableRowSelection
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        manualPagination
        page={page}
        pageSize={limit}
        total={total}
        pageCount={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
        pageSizeOptions={[10, 20, 50, 100]}
        customFooter={
          <BulkActionFooter
            selectedCount={selectedIds.length}
            actions={[
              {
                label: "Delete Selected",
                variant: "destructive",
                onClick: () => {
                  if (selectedIds.length === 1) {
                    handleDeleteClick(selectedIds[0])
                  } else {
                    Promise.all(
                      selectedIds.map((id) => api.delete(`/quotes/${id}`))
                    )
                      .then(() => {
                        fetchQuotes()
                      })
                      .catch(() =>
                        toast.error("Failed to delete selected quotes")
                      )
                  }
                  setSelectedIds([])
                },
              },
            ]}
          />
        }
      />

      <Sheet
        open={!!selectedQuote}
        onOpenChange={(open) => !open && setSelectedQuote(null)}
      >
        <SheetContent className="overflow-y-auto p-6 sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Quote Details</SheetTitle>
            <SheetDescription>
              View and update quote information
            </SheetDescription>
          </SheetHeader>

          {selectedQuote && (
            <div className="mt-6 space-y-6">
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
                  <p className="font-medium">
                    {selectedQuote.destinationCountry}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Goods Type</Label>
                  <p className="font-medium">
                    {selectedQuote.goodsType || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Weight</Label>
                  <p className="font-medium">{selectedQuote.weight || "-"}</p>
                </div>
              </div>

              <form onSubmit={editHandleSubmit(onEditSubmit)}>
                <div className="border-t pt-4">
                  <Label className="mb-2 block text-muted-foreground">
                    Status
                  </Label>
                  <Controller
                    name="status"
                    control={editControl}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                    )}
                  />
                  {editErrors.status && (
                    <p className="text-sm text-red-500">
                      {editErrors.status.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block text-muted-foreground">
                    Price
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter price"
                    {...editRegister("price")}
                  />
                  {editErrors.price && (
                    <p className="text-sm text-red-500">
                      {editErrors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block text-muted-foreground">
                    Remarks
                  </Label>
                  <Textarea
                    placeholder="Add remarks..."
                    {...editRegister("remarks")}
                    rows={3}
                  />
                  {editErrors.remarks && (
                    <p className="text-sm text-red-500">
                      {editErrors.remarks.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={editForm.formState.isSubmitting}
                    className="flex-1"
                  >
                    {editForm.formState.isSubmitting ? (
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
              </form>

              <div className="border-t pt-4">
                <Label className="mb-2 block text-muted-foreground">
                  Created
                </Label>
                <p className="text-sm">
                  {new Date(selectedQuote.createdAt).toLocaleString()}
                </p>
                {selectedQuote.updatedAt !== selectedQuote.createdAt && (
                  <>
                    <Label className="mt-2 block text-muted-foreground">
                      Last Updated
                    </Label>
                    <p className="text-sm">
                      {new Date(selectedQuote.updatedAt).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={emailDialogOpen}
        onOpenChange={(o) => {
          setEmailDialogOpen(o)
          if (!o) setPendingEmailData(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send a custom email to {selectedQuote?.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={emailHandleSubmit(onEmailSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>To</Label>
                <Input value={selectedQuote?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  {...emailRegister("subject")}
                  placeholder="Enter subject..."
                />
                {emailErrors.subject && (
                  <p className="text-sm text-red-500">
                    {emailErrors.subject.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  {...emailRegister("message")}
                  placeholder="Enter your message..."
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setEmailDialogOpen(false)
                  setPendingEmailData(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={emailForm.formState.isSubmitting}>
                {emailForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Email"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Quote"
        description="Are you sure you want to delete this quote? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Send Email</DialogTitle>
            <DialogDescription>
              Send email to {selectedQuote?.email}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Subject: {pendingEmailData?.subject}
            </p>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              Message preview: {pendingEmailData?.message}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
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
    </AnimatedPage>
  )
}
