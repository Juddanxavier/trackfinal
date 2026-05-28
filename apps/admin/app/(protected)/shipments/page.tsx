"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { MoreHorizontalIcon, PlusIcon, RefreshCwIcon, BanIcon, EditIcon, Trash2Icon, MailIcon, FileTextIcon, PackageCheckIcon, SearchIcon, FilterIcon } from "lucide-react"
import { ShipmentStatsCards } from "@/components/shipment-stats-cards"
import { COUNTRY_CODES, getDialCode, prependCountryCode } from "@/lib/phone"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { BulkActionFooter } from "@/components/bulk-action-footer"
import { DataTable, RowCheckbox, SelectAllCheckbox, type ColumnDef, type SortingState } from "@/components/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { ExportButton } from "@/components/export-button"
import { AnimatedPage, AnimatedCard, AnimatedList, AnimatedListItem } from "@/components/animated-page"
import { z } from "zod"

// Input validation schemas
const emailSchema = z.string().email().max(255).optional()
const phoneSchema = z.string().regex(/^[\d\s\-+()]+$/).max(20).optional()
const trackingNumberSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9\-]+$/)
const nameSchema = z.string().min(1).max(200)

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
  const router = useRouter()
  const { selectedOrganisation, isLoading: authLoading, user } = useAuth()
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
  const [createStep, setCreateStep] = useState(1)
  const [creating, setCreating] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [carrierOpen, setCarrierOpen] = useState(false)
  const carrierRef = React.useRef<HTMLDivElement>(null)
  
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean; shipment: Shipment | null }>({ open: false, shipment: null })
  const [archiving, setArchiving] = useState(false)

  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    shipment: Shipment | null
    type: "stoptrack" | "retrack" | "changecarrier" | null
  }>({ open: false, shipment: null, type: null })
  const [actionLoading, setActionLoading] = useState(false)
  const [newCarrierCode, setNewCarrierCode] = useState("")
  const [carrierAttempts, setCarrierAttempts] = useState<{ attempts: number; attempts_left: number } | null>(null)
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [branchId, setBranchId] = useState("all")

  const [editDialog, setEditDialog] = useState<{ open: boolean; shipment: Shipment | null }>({ open: false, shipment: null })
  const [editForm, setEditForm] = useState({ recipientName: "", recipientEmail: "", recipientPhone: "", branchId: "", billAmount: "" })
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (carrierRef.current && !carrierRef.current.contains(event.target as Node)) {
        setCarrierOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const [formData, setFormData] = useState({
    trackingNumber: "",
    carrierCode: "",
    carrierName: "",
    recipientEmail: "",
    recipientPhone: "",
    recipientName: "",
    userId: "",
    branchId: "",
    billAmount: "",
  })
  const [assignToSelf, setAssignToSelf] = useState(false)

  const [userLookupStatus, setUserLookupStatus] = useState<{email?: string; phone?: string}>({})

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
      console.error("Failed to fetch shipments:", err)
    } finally {
      setLoading(false)
    }
  }

const fetchStats = async () => {
    if (!selectedOrganisation) return
    try {
      const res = await api.get(`/shipments/stats?organisationId=${selectedOrganisation}`, { throwOnError: false }) as any
      if (res && res.total !== undefined) {
        setStats({
          total: Number(res.total),
          pending: Number(res.pending),
          inTransit: Number(res.inTransit),
          delivered: Number(res.delivered),
        })
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  const fetchCarriers = async () => {
    try {
      const res = (await api.get("/carriers", { throwOnError: false })) as any
      if (res && Array.isArray(res)) {
        setCarriers(res)
      }
    } catch (err) {
      console.error("Failed to fetch carriers:", err)
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
      const res = await api.get(`/organisations/${selectedOrganisation}/branches`, { throwOnError: false }) as any
      if (Array.isArray(res)) {
        setBranches(res)
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err)
    }
  }

  const detectCarrier = async (trackingNumber: string) => {
    if (!trackingNumber) return
    setDetecting(true)
    try {
      const res = (await api.get(
        `/carriers/detect?trackingNumber=${encodeURIComponent(trackingNumber)}`,
        { throwOnError: false }
      )) as any
      if (res?.detected && res?.carrierCode) {
        setFormData((prev) => ({
          ...prev,
          carrierCode: res.carrierCode || "",
          carrierName: res.carrierName || "",
        }))
      }
    } catch (err) {
      console.error("Failed to detect carrier:", err)
    } finally {
      setDetecting(false)
    }
  }

  const lookupUser = async (email?: string, phone?: string) => {
    if (!email && !phone) return null
    
    // Validate inputs before sending to API
    try {
      if (email) {
        emailSchema.parse(email)
      }
      if (phone) {
        phoneSchema.parse(phone)
      }
    } catch (validationErr) {
      toast.error("Invalid input format")
      return null
    }
    
    try {
      const params = new URLSearchParams()
      if (email) params.set("email", email)
      if (phone) params.set("phone", phone)
      const res = await api.get<{ id: string; name?: string; email?: string; phoneNumber?: string }>(`/users/lookup?${params}`, { throwOnError: false })
      if (res?.id) {
        setFormData((prev) => ({
          ...prev,
          userId: res.id,
          recipientName: res.name || prev.recipientName || "",
          recipientEmail: res.email || prev.recipientEmail || "",
          recipientPhone: res.phoneNumber || prev.recipientPhone || "",
        }))
        toast.success("User found! Notifications will be sent to this user.")
        return res
      } else {
        toast.info("No user found with this email/phone. Notifications will be sent to recipient contact instead.")
      }
    } catch (err) {
      console.error("Failed to lookup user:", err)
    }
    return null
  }

  const handleCreateShipment = async () => {
    // Validate inputs using Zod schemas
    try {
      trackingNumberSchema.parse(formData.trackingNumber)
      if (!assignToSelf) {
        nameSchema.parse(formData.recipientName)
        phoneSchema.parse(formData.recipientPhone)
        if (formData.recipientEmail) {
          emailSchema.parse(formData.recipientEmail)
        }
      }
    } catch (validationErr: any) {
      const field = validationErr?.issues?.[0]?.path?.[0] || "input"
      toast.error(`Invalid ${field}`)
      return
    }

    if (!formData.trackingNumber) {
      toast.error("Please enter a tracking number")
      return
    }

    if (!assignToSelf && (!formData.recipientName || !formData.recipientPhone)) {
      toast.error("Please fill in recipient name and phone, or assign to self")
      return
    }

    setCreating(true)
    try {
      let phone = formData.recipientPhone.replace(/\s/g, "")
      if (!phone.startsWith("+")) {
        const code = getDialCode(orgCountry)
        phone = code + phone
      }

      const res: any = await api.post(
        "/shipments",
        {
          trackingNumber: formData.trackingNumber,
          carrierCode: formData.carrierCode || "unknown",
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail || undefined,
          recipientPhone: phone,
          userId: formData.userId || undefined,
          organisationId: selectedOrganisation,
          branchId: formData.branchId || undefined,
          billAmount: formData.billAmount ? parseFloat(formData.billAmount) : undefined,
        },
        { throwOnError: false, timeout: 30000 }
      )

      if (res?.error) {
        toast.error(res.message || "Failed to create shipment")
        return
      }

      toast.success("Shipment created")
      setOpenCreateDialog(false)
      setFormData({
        trackingNumber: "",
        carrierCode: "",
        carrierName: "",
        recipientEmail: "",
        recipientPhone: "",
        recipientName: "",
        userId: "",
        branchId: "",
        billAmount: "",
      })
      fetchShipments()
      fetchStats()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create shipment")
    } finally {
      setCreating(false)
    }
  }

  const openEditShipment = (shipment: Shipment) => {
    setEditForm({
      recipientName: shipment.recipientName || "",
      recipientEmail: shipment.recipientEmail || "",
      recipientPhone: shipment.recipientPhone || "",
      branchId: shipment.branchId || "",
      billAmount: shipment.billAmount != null ? String(shipment.billAmount) : "",
    })
    setEditDialog({ open: true, shipment })
  }

  const handleUpdateShipment = async () => {
    if (!editDialog.shipment) return
    if (!editForm.recipientName || !editForm.recipientPhone || !editForm.branchId) {
      toast.error("Name, phone, and branch are required")
      return
    }
    setSavingEdit(true)
    try {
      const payload: any = {
        recipientName: editForm.recipientName,
        recipientEmail: editForm.recipientEmail || undefined,
        recipientPhone: editForm.recipientPhone,
        branchId: editForm.branchId,
      }
      if (editForm.billAmount) {
        payload.billAmount = parseFloat(editForm.billAmount)
      }
      const res: any = await api.patch(`/shipments/${editDialog.shipment.id}`, payload, { throwOnError: false })
      if (res?.error) {
        toast.error(res.message || "Failed to update shipment")
        return
      }
      toast.success("Shipment updated")
      setEditDialog({ open: false, shipment: null })
      fetchShipments()
      fetchStats()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update shipment")
    } finally {
      setSavingEdit(false)
    }
  }

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; shipment: Shipment | null }>({ open: false, shipment: null })
  const [deleting, setDeleting] = useState(false)

  const handleDeleteShipment = async () => {
    if (!deleteDialog.shipment) return
    setDeleting(true)
    try {
      await api.delete(`/shipments/${deleteDialog.shipment.id}`, { throwOnError: false })
      toast.success("Shipment deleted")
      setDeleteDialog({ open: false, shipment: null })
      fetchShipments()
      fetchStats()
    } catch (err) {
      console.error("Failed to delete shipment:", err)
      toast.error("Failed to delete shipment")
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/shipments/${id}`, { throwOnError: false })))
      toast.success(`${selectedIds.length} shipments deleted`)
      setSelectedIds([])
      setBulkDeleteDialog(false)
      fetchShipments()
      fetchStats()
    } catch (err) {
      console.error("Bulk delete failed:", err)
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
      console.error("Failed to archive shipment:", err)
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
      console.error("Failed to unarchive shipment:", err)
      toast.error("Failed to unarchive shipment")
    }
  }

  const handleDownloadInvoice = (shipment: Shipment) => {
    const token = localStorage.getItem("track_access_token")
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
    try {
      const res = await fetch(`${baseUrl}/invoices/${shipment.id}/send-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Invoice email queued")
      } else {
        toast.error(data.message || "Failed to send invoice")
      }
    } catch {
      toast.error("Failed to send invoice")
    }
  }

  const handleStopTrack = async (shipment: Shipment) => {
    setActionLoading(true)
    try {
      const res = await api.post("/tracking/stoptrack", [
        { number: shipment.trackingNumber, carrier: parseInt(shipment.carrierCode) || 0 }
      ], { throwOnError: false }) as any
      if (res?.accepted?.length > 0) {
        toast.success(`Tracking stopped for ${shipment.trackingNumber}`)
      } else {
        toast.error(res?.rejected?.[0]?.error || "Failed to stop tracking")
      }
    } catch (err) {
      toast.error("Failed to stop tracking")
    } finally {
      setActionDialog({ open: false, shipment: null, type: null })
      setActionLoading(false)
    }
  }

  const handleReTrack = async (shipment: Shipment) => {
    setActionLoading(true)
    try {
      const res = await api.post("/tracking/retrack", [
        { number: shipment.trackingNumber, carrier: parseInt(shipment.carrierCode) || 0 }
      ], { throwOnError: false }) as any
      if (res?.accepted?.length > 0) {
        toast.success(`Re-tracking ${shipment.trackingNumber}`)
      } else {
        toast.error(res?.rejected?.[0]?.error || "Failed to re-track")
      }
    } catch (err) {
      toast.error("Failed to re-track")
    } finally {
      setActionDialog({ open: false, shipment: null, type: null })
      setActionLoading(false)
    }
  }

  const handleChangeCarrier = async (shipment: Shipment) => {
    if (!newCarrierCode) {
      toast.error("Please select a new carrier")
      return
    }
    setActionLoading(true)
    try {
      const res = await api.post("/tracking/changecarrier", [
        { 
          number: shipment.trackingNumber, 
          carrier_old: parseInt(shipment.carrierCode) || 0,
          carrier_new: parseInt(newCarrierCode)
        }
      ], { throwOnError: false }) as any
      if (res?.accepted?.length > 0) {
        toast.success(`Carrier changed for ${shipment.trackingNumber}`)
        fetchShipments()
      } else {
        const rejected = res?.rejected?.[0]
        toast.error(rejected?.error || "Failed to change carrier")
      }
    } catch (err) {
      toast.error("Failed to change carrier")
    } finally {
      setActionDialog({ open: false, shipment: null, type: null })
      setNewCarrierCode("")
      setCarrierAttempts(null)
      setActionLoading(false)
    }
  }

  const fetchCarrierAttempts = async (trackingNumber: string) => {
    try {
      const res = await api.get(`/tracking/changecarrier/${trackingNumber}`, { throwOnError: false }) as any
      if (res && res.attempts_left !== undefined) {
        setCarrierAttempts(res)
      }
    } catch (err) {
      console.error("Failed to fetch carrier attempts:", err)
    }
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
    // Wait for auth to be initialized before making API calls
    if (authLoading || !user) {
      console.log('[Shipments] Waiting for auth...', { authLoading, hasUser: !!user })
      return
    }
    
    const abortController = new AbortController()
    
    console.log('[Shipments] Auth ready, fetching initial data')
    fetchStats()
    fetchCarriers()
    fetchQuota()
    fetchBranches()
    if (user?.role === "staff" && user?.branchId) {
      setBranchId(user.branchId)
    } else {
      setBranchId("")
    }
    const interval = setInterval(fetchQuota, 60 * 60 * 1000)
    
    return () => {
      clearInterval(interval)
      abortController.abort()
    }
  }, [selectedOrganisation, authLoading, user])

  useEffect(() => {
    if (authLoading || !user) return
    if (selectedOrganisation) {
      api.get<{ countryCode?: string }>(`/organisations/${selectedOrganisation}`).then((org) => {
        setOrgCountry(org?.countryCode || "US")
      }).catch(() => setOrgCountry("US"))
    } else {
      setOrgCountry("US")
    }
  }, [selectedOrganisation, authLoading, user])

  useEffect(() => {
    if (!openCreateDialog) {
      setFormData({
        trackingNumber: "",
        carrierCode: "",
        carrierName: "",
        recipientEmail: "",
        recipientPhone: "",
        recipientName: "",
        userId: "",
        branchId: "",
        billAmount: "",
      })
    }
  }, [openCreateDialog])

  useEffect(() => {
    if (!openCreateDialog) {
      setCreateStep(1)
    }
  }, [openCreateDialog])

  const openActionDialog = (shipment: Shipment, type: "stoptrack" | "retrack" | "changecarrier") => {
    setActionDialog({ open: true, shipment, type })
    if (type === "changecarrier") {
      fetchCarrierAttempts(shipment.trackingNumber)
    }
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
        const amount = row.original.billAmount;
        return amount != null ? `$${Number(amount).toFixed(2)}` : "-";
      },
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString(),
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
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
              <DropdownMenuItem onClick={() => openActionDialog(shipment, "changecarrier")}>
                <PackageCheckIcon className="mr-2 h-4 w-4" />
                Change Carrier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openActionDialog(shipment, "stoptrack")}>
                <BanIcon className="mr-2 h-4 w-4" />
                Stop Tracking
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openActionDialog(shipment, "retrack")}>
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
                <DropdownMenuItem onClick={() => setArchiveDialog({ open: true, shipment })}>
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
            <h1 className="text-2xl font-bold">Shipments</h1>
            {quota && (
              <Badge variant="secondary" className="text-xs">
                17Track Remaining Quota: {quota.remaining}/{quota.total}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Track and manage all your shipments in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCreateDialog(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Shipment
          </Button>
        </div>
      </div>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
            <DialogDescription>
              {createStep === 1 && "Enter tracking number and select carrier."}
              {createStep === 2 && "Enter recipient details."}
              {createStep === 3 && "Assign ownership and billing."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-1 mb-4">
            <div className={`h-1 flex-1 rounded-full ${createStep >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full ${createStep >= 2 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full ${createStep >= 3 ? "bg-primary" : "bg-muted"}`} />
          </div>
          <div className="grid gap-4">
            {createStep === 1 && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="trackingNumber"
                      placeholder="Enter tracking number"
                      value={formData.trackingNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          trackingNumber: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => detectCarrier(formData.trackingNumber)}
                      disabled={!formData.trackingNumber || detecting}
                    >
                      {detecting ? "..." : "Detect"}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <div className="relative" ref={carrierRef}>
                    <Input
                      id="carrier"
                      placeholder="Search carrier..."
                      value={carriers.find((c) => c.key === formData.carrierCode)?.name_en || ""}
                      onChange={(e) => {
                        const search = e.target.value.toLowerCase()
                        const filtered = carriers.filter((c) => 
                          c.name_en.toLowerCase().includes(search)
                        )
                        if (filtered.length === 1) {
                          setFormData((prev) => ({
                            ...prev,
                            carrierCode: filtered[0].key,
                            carrierName: filtered[0].name_en,
                          }))
                        } else if (filtered.length === 0) {
                          setFormData((prev) => ({
                            ...prev,
                            carrierCode: "",
                            carrierName: "",
                          }))
                        }
                      }}
                      onFocus={() => setCarrierOpen(true)}
                    />
                    {carrierOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                        {carriers.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No carriers</div>
                        ) : (
                          carriers.map((carrier) => (
                            <div
                              key={carrier.key}
                              className="px-3 py-2 cursor-pointer hover:bg-accent"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  carrierCode: carrier.key,
                                  carrierName: carrier.name_en,
                                }))
                                setCarrierOpen(false)
                              }}
                            >
                              {carrier.name_en}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {createStep === 2 && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="assignToSelf"
                    checked={assignToSelf}
                    onCheckedChange={(checked) => {
                      setAssignToSelf(checked as boolean)
                      if (checked) {
                        setFormData((prev) => ({
                          ...prev,
                          userId: user?.id || "",
                          recipientEmail: user?.email || "",
                          recipientPhone: user?.phoneNumber || "",
                          recipientName: user?.name || "",
                        }))
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          userId: "",
                          recipientEmail: "",
                          recipientPhone: "",
                          recipientName: "",
                        }))
                      }
                    }}
                  />
                  <Label htmlFor="assignToSelf" className="text-sm font-normal cursor-pointer">
                    Assign to me (self)
                  </Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recipientEmail">Email (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipientEmail"
                      placeholder="recipient@example.com"
                      type="email"
                      value={formData.recipientEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recipientEmail: e.target.value,
                          userId: "",
                        }))
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => lookupUser(formData.recipientEmail)}
                      disabled={!formData.recipientEmail}
                      type="button"
                    >
                      Lookup
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recipientPhone">Phone</Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipientPhone"
                      placeholder={getDialCode(orgCountry) + " 9000000000"}
                      value={formData.recipientPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recipientPhone: e.target.value,
                          userId: "",
                        }))
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => lookupUser(undefined, formData.recipientPhone)}
                      disabled={!formData.recipientPhone}
                      type="button"
                    >
                      Lookup
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    placeholder="Enter name"
                    value={formData.recipientName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recipientName: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}
            {createStep === 3 && (
              <>
                {user?.role === "admin" && branches.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Branch *</Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, branchId: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Bill Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.billAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, billAmount: e.target.value }))
                    }
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            {createStep === 1 && (
              <>
                <Button variant="outline" onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
                <Button onClick={() => setCreateStep(2)}>Next</Button>
              </>
            )}
            {createStep === 2 && (
              <>
                <Button variant="outline" onClick={() => setCreateStep(1)}>Back</Button>
                <Button onClick={() => setCreateStep(3)}>Next</Button>
              </>
            )}
            {createStep === 3 && (
              <>
                <Button variant="outline" onClick={() => setCreateStep(2)}>Back</Button>
                <Button
                  onClick={handleCreateShipment}
                  disabled={creating || !formData.trackingNumber || (!assignToSelf && (!formData.recipientName || !formData.recipientPhone)) || (user?.role === "admin" && !formData.branchId)}
                >
                  {creating ? "Creating..." : "Create Shipment"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            {user?.role === "admin" && branches.length > 0 && (
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
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
        emptyState={
          <Empty>
            <EmptyDescription>No shipments found</EmptyDescription>
          </Empty>
        }
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
        customFooter={<BulkActionFooter
          selectedCount={selectedIds.length}
          actions={[
            { label: "Delete Selected", variant: "destructive", onClick: () => setBulkDeleteDialog(true) },
          ]}
        />}
      />

      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, shipment: null, type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "stoptrack" && "Stop Tracking"}
              {actionDialog.type === "retrack" && "Re-track Shipment"}
              {actionDialog.type === "changecarrier" && "Change Carrier"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "stoptrack" && `Stop tracking updates for ${actionDialog.shipment?.trackingNumber} on 17TRACK`}
              {actionDialog.type === "retrack" && `Restart tracking for ${actionDialog.shipment?.trackingNumber}`}
              {actionDialog.type === "changecarrier" && `Change carrier for ${actionDialog.shipment?.trackingNumber}`}
            </DialogDescription>
          </DialogHeader>
          
          {actionDialog.type === "changecarrier" && (
            <div className="space-y-4">
              {carrierAttempts && (
                <div className="text-sm text-muted-foreground">
                  Carrier changes remaining: <span className="font-medium">{carrierAttempts.attempts_left}/5</span>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Current Carrier</Label>
                <Input value={actionDialog.shipment?.carrierName || actionDialog.shipment?.carrierCode || ""} disabled />
              </div>
              <div className="grid gap-2">
                <Label>New Carrier</Label>
                <Select value={newCarrierCode} onValueChange={setNewCarrierCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new carrier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers
                      .filter(c => c.key !== actionDialog.shipment?.carrierCode)
                      .map(c => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.name_en}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {actionDialog.type === "stoptrack" && (
            <p className="text-sm text-muted-foreground">
              This will stop tracking updates from 17TRACK. You can re-track later.
            </p>
          )}

          {actionDialog.type === "retrack" && (
            <p className="text-sm text-muted-foreground">
              This will restart tracking. Each tracking number can only be re-tracked once.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, shipment: null, type: null })}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!actionDialog.shipment) return
                if (actionDialog.type === "stoptrack") handleStopTrack(actionDialog.shipment)
                else if (actionDialog.type === "retrack") handleReTrack(actionDialog.shipment)
                else if (actionDialog.type === "changecarrier") handleChangeCarrier(actionDialog.shipment)
              }}
              disabled={actionLoading || (actionDialog.type === "changecarrier" && !newCarrierCode)}
            >
              {actionLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={editDialog.open} onOpenChange={(open) => { if (!open) setEditDialog({ open: false, shipment: null }) }}>
        <SheetContent side="right" className="sm:max-w-md p-6">
          <SheetHeader className="px-0">
            <SheetTitle>Edit Shipment</SheetTitle>
            <SheetDescription>
              Update recipient details for <strong>{editDialog.shipment?.trackingNumber}</strong>
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 flex-1">
            <div className="grid gap-2">
              <Label>Recipient Name *</Label>
              <Input value={editForm.recipientName} onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={editForm.recipientEmail} onChange={(e) => setEditForm({ ...editForm, recipientEmail: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Phone *</Label>
              <Input value={editForm.recipientPhone} onChange={(e) => setEditForm({ ...editForm, recipientPhone: e.target.value })} />
            </div>
            {user?.role === "admin" && branches.length > 0 && (
              <div className="grid gap-2">
                <Label>Branch *</Label>
                <Select value={editForm.branchId} onValueChange={(val) => setEditForm({ ...editForm, branchId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {user?.role === "admin" && (
              <div className="grid gap-2">
                <Label>Bill Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editForm.billAmount}
                  onChange={(e) => setEditForm({ ...editForm, billAmount: e.target.value })}
                />
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, shipment: null })}>Cancel</Button>
            <Button onClick={handleUpdateShipment} disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, shipment: deleteDialog.shipment })}
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
        onOpenChange={(open) => setArchiveDialog({ open, shipment: archiveDialog.shipment })}
        title="Archive Shipment"
        description={`Are you sure you want to archive ${archiveDialog.shipment?.trackingNumber}?`}
        confirmLabel="Archive"
        loading={archiving}
        onConfirm={handleArchive}
      />
    </AnimatedPage>
  )
}
