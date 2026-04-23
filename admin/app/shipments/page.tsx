"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { ShipmentStatsCards } from "@/components/shipments/shipments-stats-cards"
import { SearchTabs } from "@/components/search-tabs"
import { api } from "@/lib/api"
import {
  MoreHorizontalIcon,
  PlusIcon,
  Loader2Icon,
  SparklesIcon,
  PackageIcon,
  CheckIcon,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Pagination } from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
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
import { Empty, EmptyDescription } from "@/components/ui/empty"
import { useRouter } from "next/navigation"

type ShipmentStatus = "pending" | "in_transit" | "delivered" | "cancelled"

interface Shipment {
  id: string
  trackingNumber: string
  whiteLabelTrackingCode: string
  carrierCode: string
  recipientName: string
  recipientEmail?: string
  recipientPhone?: string
  originCountry: string
  destinationCountry: string
  status: ShipmentStatus
  goodsType: string
  weight?: string
  createdAt: string
  updatedAt: string
}

interface Stats {
  total: number
  pending: number
  in_transit: number
  delivered: number
  cancelled: number
  recent?: number
}

interface Carrier {
  key: string
  name: string
}

interface TrackData {
  origin?: string
  destination?: string
  weight?: string
  description?: string
}

export default function ShipmentsPage() {
  const { selectedOrganisation } = useAuth()
  const router = useRouter()
  const [shipments, setShipments] = useState<Shipment[]>([])
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

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [formError, setFormError] = useState("")
  const [trackData, setTrackData] = useState<TrackData | null>(null)
  const [formData, setFormData] = useState({
    trackingNumber: "",
    carrierCode: "",
    senderEmail: "",
    recipientName: "",
    recipientPhone: "",
  })
  const [senderFound, setSenderFound] = useState(false)
  const [recipientFound, setRecipientFound] = useState(false)

  interface UserInfo {
    id: string
    name: string
    email: string
    phoneNumber?: string
  }

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

      const res = await api.get<{
        data: Shipment[]
        total: number
        page: number
        limit: number
        totalPages: number
      }>(`/shipments?${params}`)
      setShipments(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (err) {
      console.error("Failed to fetch shipments:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchShipments()
  }, [search])

  useEffect(() => {
    fetchShipments()
  }, [
    page,
    limit,
    statusFilter,
    selectedOrganisation,
    sortColumn,
    sortDirection,
  ])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get<Stats>(`/shipments/stats`)
        setStats(res)
      } catch (err) {
        console.error("Failed to fetch stats:", err)
      }
    }
    fetchStats()
  }, [selectedOrganisation])

  const handleDetectCarrier = async () => {
    if (!formData.trackingNumber) {
      setFormError("Enter tracking number first")
      return
    }
    setDetecting(true)
    try {
      const res = await api.post<{
        detected: boolean
        carrierCode?: string
        trackData?: TrackData
      }>("/shipments/detect-carrier", {
        trackingNumber: formData.trackingNumber,
      })
      if (res.detected && res.carrierCode) {
        setFormData((prev) => ({ ...prev, carrierCode: res.carrierCode! }))
        if (res.trackData) {
          setTrackData(res.trackData)
        }
      } else {
        setFormError("Could not detect carrier")
      }
    } catch (err) {
      setFormError("Failed to detect carrier")
    } finally {
      setDetecting(false)
    }
  }

  const handleLookupSender = async (email: string) => {
    if (!email || email.length < 3) return
    try {
      const res = await api.get<UserInfo | null>(
        `/users/lookup?email=${encodeURIComponent(email)}`
      )
      if (res) {
        setSenderFound(true)
        if (res.phoneNumber) {
          setFormData((prev) => ({
            ...prev,
            senderEmail: res.email,
            recipientName: prev.recipientName || res.name,
            recipientPhone: prev.recipientPhone || res.phoneNumber || "",
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            senderEmail: res.email,
            recipientName: prev.recipientName || res.name,
          }))
        }
      } else {
        setSenderFound(false)
      }
    } catch (err) {
      setSenderFound(false)
    }
  }

  const handleLookupRecipientPhone = async (phone: string) => {
    if (!phone || phone.length < 5) return
    try {
      const res = await api.get<UserInfo | null>(
        `/users/lookup?phone=${encodeURIComponent(phone)}`
      )
      if (res) {
        setRecipientFound(true)
        setFormData((prev) => ({
          ...prev,
          recipientName: prev.recipientName || res.name,
          senderEmail: prev.senderEmail || res.email,
        }))
      } else {
        setRecipientFound(false)
      }
    } catch (err) {
      setRecipientFound(false)
    }
  }

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.trackingNumber ||
      !formData.carrierCode ||
      !formData.senderEmail ||
      !formData.recipientName
    ) {
      setFormError("Fill all required fields")
      return
    }
    setCreating(true)
    try {
      await api.post<{ id: string }>("/shipments", {
        trackingNumber: formData.trackingNumber,
        carrierCode: formData.carrierCode,
        senderEmail: formData.senderEmail,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone || undefined,
        originCountry: trackData?.origin,
        destinationCountry: trackData?.destination,
        weight: trackData?.weight,
        goodsType: trackData?.description,
      })
      setCreateDialogOpen(false)
      setFormData({
        trackingNumber: "",
        carrierCode: "",
        senderEmail: "",
        recipientName: "",
        recipientPhone: "",
      })
      setTrackData(null)
      setSenderFound(false)
      setRecipientFound(false)
      fetchShipments()
      const fetchStats = async () => {
        const res = await api.get<Stats>(`/shipments/stats`)
        setStats(res)
      }
      fetchStats()
    } catch (err: any) {
      setFormError(err.message || "Failed to create shipment")
    } finally {
      setCreating(false)
    }
  }

  const handleViewDetails = (id: string) => {
    router.push(`/shipments/${id}`)
  }

  const statusVariants: Record<ShipmentStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_transit: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }

  const statusLabels: Record<ShipmentStatus, string> = {
    pending: "Pending",
    in_transit: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all shipments
          </p>
        </div>
        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open)
            if (!open) {
              setSenderFound(false)
              setRecipientFound(false)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Shipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Shipment</DialogTitle>
              <DialogDescription>
                Enter tracking number to auto-detect carrier and fetch details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateShipment} className="space-y-4">
              {formError && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking Number *</Label>
                <div className="flex gap-2">
                  <Input
                    id="trackingNumber"
                    placeholder="Enter tracking number"
                    value={formData.trackingNumber}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        trackingNumber: e.target.value,
                      }))
                      setFormError("")
                      setTrackData(null)
                    }}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDetectCarrier}
                    disabled={detecting}
                  >
                    {detecting ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <SparklesIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrierCode">Carrier *</Label>
                <Input
                  id="carrierCode"
                  placeholder="Carrier code (e.g., dhl, ups)"
                  value={formData.carrierCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      carrierCode: e.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>

              {trackData && (
                <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
                  {trackData.origin && <p>Origin: {trackData.origin}</p>}
                  {trackData.destination && (
                    <p>Destination: {trackData.destination}</p>
                  )}
                  {trackData.weight && <p>Weight: {trackData.weight}</p>}
                  {trackData.description && (
                    <p>Description: {trackData.description}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="senderEmail">Email *</Label>
                <div className="relative">
                  <Input
                    id="senderEmail"
                    type="email"
                    placeholder="sender@example.com"
                    value={formData.senderEmail}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        senderEmail: e.target.value,
                      }))
                      setSenderFound(false)
                      handleLookupSender(e.target.value)
                    }}
                    required
                  />
                  {senderFound && (
                    <CheckIcon className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-green-500" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Name *</Label>
                  <Input
                    id="recipientName"
                    placeholder="Full name"
                    value={formData.recipientName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recipientName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="recipientPhone"
                      type="tel"
                      placeholder="+1 234 567 890"
                      value={formData.recipientPhone}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          recipientPhone: e.target.value,
                        }))
                        setRecipientFound(false)
                        handleLookupRecipientPhone(e.target.value)
                      }}
                    />
                    {recipientFound && (
                      <CheckIcon className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stats && <ShipmentStatsCards {...stats} />}

      <SearchTabs
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search shipments..."
        tabsValue={statusFilter}
        onTabsChange={setStatusFilter}
        tabs={[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "in_transit", label: "In Transit" },
          { value: "delivered", label: "Delivered" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      />

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
                Carrier
              </SortableTableHead>
              <SortableTableHead
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              >
                Recipient
              </SortableTableHead>
              <TableHead>Route</TableHead>
              <SortableTableHead
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              >
                Status
              </SortableTableHead>
              <SortableTableHead
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              >
                Created
              </SortableTableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
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
                  <TableCell className="font-medium">
                    {shipment.trackingNumber}
                  </TableCell>
                  <TableCell className="uppercase">
                    {shipment.carrierCode}
                  </TableCell>
                  <TableCell>{shipment.recipientName}</TableCell>
                  <TableCell>
                    {shipment.originCountry} → {shipment.destinationCountry}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusVariants[shipment.status]}>
                      {statusLabels[shipment.status]}
                    </Badge>
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(shipment.id)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(shipment.id)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Cancel Shipment
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
                colSpan={8}
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
    </div>
  )
}
