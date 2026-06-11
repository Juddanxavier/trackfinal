"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { isAdminRole } from "@/lib/utils"
import {
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCwIcon,
  BanIcon,
  EditIcon,
  EyeIcon,
  Trash2Icon,
  MailIcon,
  FileTextIcon,
  SearchIcon,
  FilterIcon,
  PackageCheckIcon,
} from "lucide-react"
import { ShipmentStatsCards } from "@/components/shipment-stats-cards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { BulkActionFooter } from "@/components/bulk-action-footer"
import {
  DataTable,
  RowCheckbox,
  SelectAllCheckbox,
  type ColumnDef,
  type SortingState,
} from "@/components/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ExportButton } from "@/components/export-button"
import { useSocketRefresh } from "@/lib/hooks/use-socket-refresh"
import { useUndoAction } from "@/lib/hooks/use-undo-action"
import { AnimatedPage } from "@/components/animated-page"
import { CreateShipmentDialog } from "@/components/shipments/create-shipment-dialog"
import { ShipmentActionDialog } from "@/components/shipments/shipment-action-dialog"
import { EditShipmentSheet } from "@/components/shipments/edit-shipment-sheet"

type ShipmentStatus = "pending" | "in_transit" | "delivered" | "exception"

interface Shipment {
  id: string
  trackingNumber: string
  whiteLabelTrackingCode?: string
  carrierCode: string
  carrierName?: string
  status: ShipmentStatus
  recipientName?: string
  recipientEmail?: string
  recipientPhone?: string
  branchId?: string
  billAmount?: number
  archivedAt?: string | null
  createdAt: string
}

interface Carrier {
  key: string
  name_en: string
}

interface Stats {
  total: number
  pending: number
  inTransit: number
  delivered: number
}

const statusVariants: Record<ShipmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_transit: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  exception: "bg-red-100 text-red-800",
}

export default function ShipmentsPage() {
  const { selectedOrganisation, isLoading: authLoading, user } = useAuth()
  const router = useRouter()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [loading, setLoading] = useState(true)
  const [orgCountry, setOrgCountry] = useState("")

  const [quota, setQuota] = useState<{
    used: number
    total: number
    remaining: number
  } | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean
    shipment: Shipment | null
  }>({ open: false, shipment: null })
  const [archiving, setArchiving] = useState(false)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    shipment: Shipment | null
    type: "stoptrack" | "retrack" | "changecarrier" | null
  }>({ open: false, shipment: null, type: null })
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    shipment: Shipment | null
  }>({ open: false, shipment: null })
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [branchId, setBranchId] = useState("all")
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    shipment: Shipment | null
  }>({ open: false, shipment: null })
  const [deleting, setDeleting] = useState(false)
  const { fire } = useUndoAction()

  const fetchShipments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", limit.toString())
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (selectedOrganisation)
        params.set("organisationId", selectedOrganisation)
      if (branchId && branchId !== "all") params.set("branchId", branchId)
      if (sorting.length > 0) {
        params.set("sortBy", sorting[0].id)
        params.set("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const res = (await api.get(`/shipments?${params}`, {
        throwOnError: false,
      })) as any
      if (res && res.data) {
        setShipments(res.data || [])
        setTotal(res.total || 0)
        setTotalPages(res.totalPages || 0)
      }
    } catch (err) {
      toast.error("Failed to fetch shipments")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!selectedOrganisation) return
    try {
      const res = (await api.get(
        `/shipments/stats?organisationId=${selectedOrganisation}`,
        { throwOnError: false }
      )) as any
      if (res && res.total !== undefined) {
        setStats({
          total: Number(res.total),
          pending: Number(res.pending),
          inTransit: Number(res.inTransit),
          delivered: Number(res.delivered),
        })
      }
    } catch (err) {
      toast.error("Failed to fetch stats")
    }
  }

  const fetchCarriers = async () => {
    try {
      const res = (await api.get("/carriers", { throwOnError: false })) as any
      if (res && Array.isArray(res)) {
        setCarriers(res)
      }
    } catch (err) {
      toast.error("Failed to fetch carriers")
    }
  }

  const fetchQuota = async () => {
    try {
      const res = (await api.get("/tracking/quota", {
        throwOnError: false,
      })) as any
      if (res && res.used !== undefined) {
        setQuota(res)
      }
    } catch (err) {
      console.error("Failed to fetch quota:", err)
    }
  }

  const fetchBranches = async () => {
    if (!selectedOrganisation) return
    try {
      const res = (await api.get(
        `/organisations/${selectedOrganisation}/branches`,
        { throwOnError: false }
      )) as any
      if (Array.isArray(res)) {
        setBranches(res)
      }
    } catch (err) {
      toast.error("Failed to fetch branches")
    }
  }

  useSocketRefresh("shipments", fetchShipments, !loading)

  const handleDeleteShipment = async () => {
    if (!deleteDialog.shipment) return
    const deletedId = deleteDialog.shipment.id
    setDeleting(true)
    try {
      await api.delete(`/shipments/${deletedId}`, {
        throwOnError: false,
      })
      setDeleteDialog({ open: false, shipment: null })
      fetchShipments()
      fetchStats()
      fire({
        description: `Shipment ${deletedId.slice(0, 8)}... deleted`,
        onUndo: async () => {
          try {
            await api.patch(`/shipments/${deletedId}/restore`)
            toast.success("Shipment restored")
            fetchShipments()
          } catch {
            toast.error("Failed to restore shipment")
          }
        },
      })
    } catch (err) {
      toast.error("Failed to delete shipment")
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      await Promise.all(
        selectedIds.map((id) =>
          api.delete(`/shipments/${id}`, { throwOnError: false })
        )
      )
      toast(`Deleted ${selectedIds.length} shipments`, {
        action: {
          label: "Undo",
          onClick: () => toast.error("Bulk undo not supported"),
        },
      })
      setSelectedIds([])
      setBulkDeleteDialog(false)
      fetchShipments()
      fetchStats()
    } catch (err) {
      toast.error("Failed to delete some shipments")
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveDialog.shipment) return
    setArchiving(true)
    try {
      await api.patch(`/shipments/${archiveDialog.shipment.id}/archive`, {})
      toast.success("Shipment archived")
      setArchiveDialog({ open: false, shipment: null })
      fetchShipments()
      fetchStats()
    } catch (err) {
      toast.error("Failed to archive shipment")
    } finally {
      setArchiving(false)
    }
  }

  const handleUnarchive = async (shipment: Shipment) => {
    try {
      await api.patch(`/shipments/${shipment.id}/unarchive`, {})
      toast.success("Shipment unarchived")
      fetchShipments()
      fetchStats()
    } catch (err) {
      toast.error("Failed to unarchive shipment")
    }
  }

  const handleDownloadInvoice = (shipment: Shipment) => {
    const token = localStorage.getItem("track_access_token")
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
    if (!token) {
      window.open(`${baseUrl}/invoices/${shipment.id}/download`, "_blank")
      return
    }
    fetch(`${baseUrl}/invoices/${shipment.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `invoice-${shipment.trackingNumber}.pdf`
        document.body.appendChild(link)
        link.click()
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 100)
      })
      .catch(() => toast.error("Failed to download invoice"))
  }

  const handleSendInvoice = async (shipment: Shipment) => {
    const token = localStorage.getItem("track_access_token")
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
    try {
      const res = await fetch(`${baseUrl}/invoices/${shipment.id}/send-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()
      if (data.success) toast.success("Invoice email queued")
      else toast.error(data.message || "Failed to send invoice")
    } catch {
      toast.error("Failed to send invoice")
    }
  }

  const openEditShipment = (shipment: Shipment) => {
    setEditDialog({ open: true, shipment })
  }

  useEffect(() => {
    if (authLoading || !user) return
    setPage(1)
    fetchShipments()
  }, [search, branchId, authLoading, user])

  useEffect(() => {
    if (authLoading || !user) return
    fetchShipments()
  }, [
    page,
    limit,
    statusFilter,
    selectedOrganisation,
    sorting,
    branchId,
    authLoading,
    user,
  ])

  useEffect(() => {
    if (authLoading || !user) return
    fetchStats()
    fetchCarriers()
    fetchQuota()
    fetchBranches()
    if (user?.role === "staff" && user?.branchId) setBranchId(user.branchId)
    else setBranchId("")
    const interval = setInterval(fetchQuota, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedOrganisation, authLoading, user])

  useEffect(() => {
    if (authLoading || !user) return
    if (selectedOrganisation) {
      api
        .get<{ countryCode?: string }>(`/organisations/${selectedOrganisation}`)
        .then((org) => {
          setOrgCountry(org?.countryCode || "US")
        })
        .catch(() => setOrgCountry("US"))
    } else {
      setOrgCountry("US")
    }
  }, [selectedOrganisation, authLoading, user])

  const openActionDialog = (
    shipment: Shipment,
    type: "stoptrack" | "retrack" | "changecarrier"
  ) => {
    setActionDialog({ open: true, shipment, type })
  }

  const columns: ColumnDef<Shipment>[] = [
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
      accessorKey: "trackingNumber",
      header: "Tracking #",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.trackingNumber}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "whiteLabelTrackingCode",
      header: "White Label Code",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.whiteLabelTrackingCode || "-"}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorFn: (row) => row.carrierName || row.carrierCode,
      id: "carrier",
      header: "Carrier",
      cell: ({ row }) =>
        row.original.carrierName || row.original.carrierCode || "Unknown",
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={statusVariants[row.original.status]}>
          {row.original.status.replace("_", " ")}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "recipientName",
      header: "Recipient",
      cell: ({ row }) => row.original.recipientName || "-",
      enableSorting: true,
    },
    {
      accessorKey: "recipientEmail",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.recipientEmail || "-"}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "recipientPhone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.recipientPhone || "-"}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "billAmount",
      header: "Bill",
      cell: ({ row }) => {
        const amount = row.original.billAmount
        return amount != null ? `₹${Number(amount).toFixed(2)}` : "-"
      },
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
        const shipment = row.original
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/shipments/${shipment.id}`)}>
                <EyeIcon className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditShipment(shipment)}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadInvoice(shipment)}>
                <FileTextIcon className="mr-2 h-4 w-4" />
                Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendInvoice(shipment)}>
                <MailIcon className="mr-2 h-4 w-4" />
                Send Invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openActionDialog(shipment, "changecarrier")}
              >
                <PackageCheckIcon className="mr-2 h-4 w-4" />
                Change Carrier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openActionDialog(shipment, "stoptrack")}
              >
                <BanIcon className="mr-2 h-4 w-4" />
                Stop Tracking
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openActionDialog(shipment, "retrack")}
              >
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Re-track
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {shipment.archivedAt ? (
                <DropdownMenuItem onClick={() => handleUnarchive(shipment)}>
                  <PackageCheckIcon className="mr-2 h-4 w-4" />
                  Unarchive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setArchiveDialog({ open: true, shipment })}
                >
                  <PackageCheckIcon className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setDeleteDialog({ open: true, shipment })}
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
            {quota && (
              <Badge variant="secondary" className="text-xs">
                17Track Remaining Quota: {quota.remaining}/{quota.total}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage all your shipments in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCreateDialog(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Shipment
          </Button>
        </div>
      </div>

      <CreateShipmentDialog
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
        onCreated={fetchShipments}
        selectedOrganisation={selectedOrganisation}
        carriers={carriers}
        user={user}
        orgCountry={orgCountry}
        branches={branches}
      />

      {stats && <ShipmentStatsCards stats={stats} />}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by tracking number, white label code, or recipient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {isAdminRole(user?.role) && branches.length > 0 && (
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <FilterIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="exception">Exception</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                setLimit(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
            <ExportButton
              sections={[
                {
                  title: "Shipments",
                  data: shipments,
                  columns: [
                    { key: "trackingNumber", header: "Tracking Number" },
                    { key: "carrierName", header: "Carrier" },
                    { key: "status", header: "Status" },
                    { key: "recipientName", header: "Recipient" },
                    { key: "recipientEmail", header: "Email" },
                    { key: "recipientPhone", header: "Phone" },
                    { key: "createdAt", header: "Created" },
                  ],
                },
              ]}
              filename={`shipments-${page}`}
            />
          </div>
        </div>
        {(search || statusFilter !== "all") && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filters active:</span>
            {search && (
              <Badge variant="secondary" className="gap-1">
                Search: {search}
                <button
                  onClick={() => setSearch("")}
                  className="ml-1 hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="ml-1 hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setStatusFilter("all")
              }}
              className="h-auto p-0 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={shipments}
        loading={loading}
        getRowId={(row) => row.id}
        onRowDoubleClick={(row) => router.push(`/shipments/${row.id}`)}
        emptyState={<EmptyState entity="shipments" />}
        renderMobileCard={(shipment) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium">
                {shipment.trackingNumber}
              </span>
              <Badge className={statusVariants[shipment.status]}>
                {shipment.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {shipment.recipientName || "-"} ·{" "}
              {shipment.carrierName || shipment.carrierCode || "Unknown"}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(shipment.createdAt).toLocaleDateString()}
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
                onClick: () => setBulkDeleteDialog(true),
              },
            ]}
          />
        }
      />

      <ShipmentActionDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          setActionDialog({
            open,
            shipment: actionDialog.shipment,
            type: actionDialog.type,
          })
        }
        shipment={actionDialog.shipment}
        type={actionDialog.type}
        carriers={carriers}
      />

      <EditShipmentSheet
        open={editDialog.open}
        onOpenChange={(open) =>
          setEditDialog({ open, shipment: editDialog.shipment })
        }
        shipment={editDialog.shipment}
        branches={branches}
        user={user}
        onUpdated={fetchShipments}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, shipment: deleteDialog.shipment })
        }
        title="Delete Shipment"
        description={`Are you sure you want to delete ${deleteDialog.shipment?.trackingNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteShipment}
      />

      <ConfirmDialog
        open={bulkDeleteDialog}
        onOpenChange={setBulkDeleteDialog}
        title="Delete Shipments"
        description={`Are you sure you want to delete ${selectedIds.length} shipments? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length} Shipments`}
        variant="destructive"
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />

      <ConfirmDialog
        open={archiveDialog.open}
        onOpenChange={(open) =>
          setArchiveDialog({ open, shipment: archiveDialog.shipment })
        }
        title="Archive Shipment"
        description={`Are you sure you want to archive ${archiveDialog.shipment?.trackingNumber}?`}
        confirmLabel="Archive"
        loading={archiving}
        onConfirm={handleArchive}
      />
    </AnimatedPage>
  )
}
