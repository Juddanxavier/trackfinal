"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { MoreHorizontalIcon, PlusIcon, RefreshCwIcon, BanIcon, EditIcon, Trash2Icon, PackageCheckIcon } from "lucide-react"
import { ShipmentStatsCards } from "@/components/shipment-stats-cards"
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
import { Empty, EmptyDescription } from "@/components/ui/empty"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PackageIcon,
  ClockIcon,
  CheckCircleIcon,
  SearchIcon,
  FilterIcon,
} from "lucide-react"
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

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}

interface Stats {
  total: number
  pending: number
  inTransit: number
  delivered: number
  totalChange?: number
  pendingChange?: number
  inTransitChange?: number
  deliveredChange?: number
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

  const COUNTRY_CODES: Record<string, string> = {
    US: "+1",
    CA: "+1",
    GB: "+44",
    AU: "+61",
    DE: "+49",
    FR: "+33",
    CN: "+86",
    JP: "+81",
    IN: "+91",
    BR: "+55",
    MX: "+52",
    LK: "+94",
  }
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
  const [sortColumn, setSortColumn] = useState("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [carrierOpen, setCarrierOpen] = useState(false)
  const carrierRef = React.useRef<HTMLDivElement>(null)
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    shipment: Shipment | null
    type: "stoptrack" | "retrack" | "changecarrier" | null
  }>({ open: false, shipment: null, type: null })
  const [actionLoading, setActionLoading] = useState(false)
  const [newCarrierCode, setNewCarrierCode] = useState("")
  const [carrierAttempts, setCarrierAttempts] = useState<{ attempts: number; attempts_left: number } | null>(null)

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
  })

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setSortColumn(column)
    setSortDirection(direction)
  }

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
      if (sortColumn) {
        params.set("sortBy", sortColumn)
        params.set("sortOrder", sortDirection)
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
        const calcChange = (trend: string[] | number[]) => {
          if (!trend || trend.length < 2) return 0
          const first = Number(trend[0])
          const last = Number(trend[trend.length - 1])
          if (first === 0) return last > 0 ? 100 : 0
          return Math.round(((last - first) / first) * 100)
        }
        setStats({
          total: Number(res.total),
          pending: Number(res.pending),
          inTransit: Number(res.inTransit),
          delivered: Number(res.delivered),
          totalChange: calcChange(res.totalTrend),
          pendingChange: calcChange(res.pendingTrend),
          inTransitChange: calcChange(res.inTransitTrend),
          deliveredChange: calcChange(res.deliveredTrend),
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
        return res
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
      nameSchema.parse(formData.recipientName)
      if (formData.recipientEmail) {
        emailSchema.parse(formData.recipientEmail)
      }
      phoneSchema.parse(formData.recipientPhone)
    } catch (validationErr) {
      toast.error("Please check your input values")
      return
    }
    
    if (!formData.trackingNumber || !formData.recipientName || !formData.recipientPhone) {
      toast.error("Please fill in tracking number, recipient name, and phone")
      return
    }
    setCreating(true)
    try {
      let phone = formData.recipientPhone.replace(/\s/g, "")
      if (!phone.startsWith("+")) {
        const code = COUNTRY_CODES[orgCountry] || "+1"
        phone = code + phone
      }

      await api.post(
        "/shipments",
        {
          trackingNumber: formData.trackingNumber,
          carrierCode: formData.carrierCode || "unknown",
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail || undefined,
          recipientPhone: phone,
          userId: formData.userId || undefined,
          organisationId: selectedOrganisation,
        },
        { throwOnError: false, timeout: 30000 }
      )
      setOpenCreateDialog(false)
      setFormData({
        trackingNumber: "",
        carrierCode: "",
        carrierName: "",
        recipientEmail: "",
        recipientPhone: "",
        recipientName: "",
        userId: "",
      })
      fetchShipments()
      fetchStats()
    } catch (err) {
      console.error("Failed to create shipment:", err)
    } finally {
      setCreating(false)
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

  const openActionDialog = (shipment: Shipment, type: "stoptrack" | "retrack" | "changecarrier") => {
    setActionDialog({ open: true, shipment, type })
    if (type === "changecarrier") {
      fetchCarrierAttempts(shipment.trackingNumber)
    }
  }

  useEffect(() => {
    if (authLoading || !user) return
    setPage(1)
    fetchShipments()
  }, [search, authLoading, user])

  useEffect(() => {
    if (authLoading || !user) return
    fetchShipments()
  }, [
    page,
    limit,
    statusFilter,
    selectedOrganisation,
    sortColumn,
    sortDirection,
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
      })
    }
  }, [openCreateDialog])

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
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage all shipments
          </p>
        </div>
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Shipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Shipment</DialogTitle>
              <DialogDescription>
                Enter the tracking number to auto-detect carrier.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
              <div className="grid gap-2">
                <Label htmlFor="recipientEmail">Recipient Email (optional)</Label>
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
                <Label htmlFor="recipientPhone">Notify Phone</Label>
                <div className="flex gap-2">
                  <Input
                    id="recipientPhone"
                    placeholder={orgCountry ? (COUNTRY_CODES[orgCountry] || "+1") + " 9000000000" : "+1 9000000000"}
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
                  placeholder="Enter recipient name"
                  value={formData.recipientName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateShipment}
                disabled={creating || !formData.trackingNumber || !formData.recipientName || !formData.recipientPhone}
              >
                {creating ? "Creating..." : "Create Shipment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
              data={shipments}
              columns={[
                { key: "trackingNumber", header: "Tracking Number" },
                { key: "carrierName", header: "Carrier" },
                { key: "status", header: "Status" },
                { key: "recipientName", header: "Recipient" },
                { key: "recipientEmail", header: "Email" },
                { key: "recipientPhone", header: "Phone" },
                { key: "createdAt", header: "Created" },
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

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox />
              </TableHead>
              <SortableTableHead
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              >
                Tracking #
              </SortableTableHead>
              <SortableTableHead
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              >
                White Label Code
              </SortableTableHead>
              <SortableTableHead
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              >
                Carrier
              </SortableTableHead>
              <TableHead>Status</TableHead>
              <SortableTableHead
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              >
                Recipient
              </SortableTableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <SortableTableHead
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              >
                Created
              </SortableTableHead>
              <TableHead className="w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Empty>
                    <EmptyDescription>No shipments found</EmptyDescription>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {shipment.trackingNumber}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {shipment.whiteLabelTrackingCode || "-"}
                  </TableCell>
                  <TableCell>
                    {shipment.carrierName || shipment.carrierCode || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusVariants[shipment.status]}>
                      {shipment.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{shipment.recipientName || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {shipment.recipientEmail || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {shipment.recipientPhone || "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/shipments/${shipment.id}`)
                          }
                        >
                          <EditIcon className="mr-2 h-4 w-4" />
                          View Details
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
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteDialog({ open: true, shipment })}
                        >
                          <Trash2Icon className="mr-2 h-4 w-4" />
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
              <td
                colSpan={10}
                className="px-4 py-3 text-sm text-muted-foreground"
              >
                Showing {total === 0 ? 0 : (page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} shipments
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

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, shipment: deleteDialog.shipment })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteDialog.shipment?.trackingNumber}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, shipment: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteShipment} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
