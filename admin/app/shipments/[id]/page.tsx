"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeftIcon,
  Loader2Icon,
  RefreshCwIcon,
  MoreHorizontalIcon,
  EditIcon,
  PackageIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  CircleIcon,
  CopyIcon,
  TruckIcon,
  PrinterIcon,
  RotateCcwIcon,
} from "lucide-react"
import Link from "next/link"

type ShipmentStatus = "pending" | "in_transit" | "delivered" | "cancelled" | "archived"

interface TrackingEvent {
  date?: string
  location?: string
  description?: string
  status?: string
}

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
  track17Data?: {
    events?: TrackingEvent[]
    origin?: string
    destination?: string
    estimatedDelivery?: string
    pending?: boolean
    pendingMessage?: string
  }
  createdAt: string
  updatedAt: string
  deliveredAt?: string
}

const statusConfig: Record<ShipmentStatus, { label: string; bg: string }> = {
  pending: { label: "Pending", bg: "bg-slate-100 text-slate-700" },
  in_transit: { label: "In Transit", bg: "bg-blue-100 text-blue-700" },
  delivered: { label: "Delivered", bg: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", bg: "bg-red-100 text-red-700" },
  archived: { label: "Archived", bg: "bg-muted text-muted-foreground" },
}

export default function ShipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string

  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({ recipientEmail: "", recipientPhone: "" })

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const res = await api.get<Shipment>(`/shipments/${shipmentId}`)
        setShipment(res)
        setFormData({ recipientEmail: res.recipientEmail || "", recipientPhone: res.recipientPhone || "" })
      } catch (err) {
        console.error("Failed to fetch shipment:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchShipment()
  }, [shipmentId])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await api.post<Shipment>(`/shipments/${shipmentId}/refresh-tracking`)
      setShipment(res)
      toast.success("Tracking refreshed successfully")
    } catch (err) {
      console.error("Failed to refresh tracking:", err)
      toast.error("Failed to refresh tracking")
    } finally {
      setRefreshing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.patch<Shipment>(`/shipments/${shipmentId}`, formData)
      setShipment(res)
      setEditing(false)
      toast.success("Shipment updated successfully")
    } catch (err) {
      console.error("Failed to update shipment:", err)
      toast.error("Failed to update shipment")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/shipments/${shipmentId}`)
      toast.success("Shipment cancelled")
      router.push("/shipments")
    } catch (err) {
      console.error("Failed to cancel shipment:", err)
      toast.error("Failed to cancel shipment")
    } finally {
      setDeleting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const handlePrint = () => window.print()

  function LoadingSkeleton() {
    return (
      <div className="p-6 lg:p-10 space-y-8">
        <div className="flex items-center gap-6 py-6 px-8 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex-1 flex items-center">
            <Skeleton className="flex-1 h-px" />
            <Skeleton className="w-8 h-8 rounded-full mx-4" />
            <Skeleton className="flex-1 h-px" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="w-20 h-6 rounded-full" />
        </div>
        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <Card className="border shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border shadow-sm">
                <CardContent className="pt-5 space-y-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex justify-between items-center">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="flex h-16 items-center px-6 lg:px-8 gap-4">
            <Skeleton className="w-9 h-9 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="w-9 h-9 rounded-md" />
              <Skeleton className="w-24 h-9 rounded-md" />
            </div>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <PackageIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Shipment not found</h2>
          <p className="text-muted-foreground mb-6">The shipment you are looking for does not exist.</p>
          <Button variant="outline" asChild>
            <Link href="/shipments">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Shipments
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const trackingEvents = shipment.track17Data?.events || []
  const { bg: statusBg, label: statusLabel } = statusConfig[shipment.status] || statusConfig.pending
  const hasPendingFlag = shipment.track17Data?.pending === true
  const isPendingFirstScan = (shipment.status === "pending" || hasPendingFlag) && trackingEvents.length === 0

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 print:hidden">
        <div className="flex h-16 items-center px-6 lg:px-8 gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/shipments">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold font-mono truncate">
                {shipment.trackingNumber}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBg}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {shipment.carrierCode.toUpperCase()} · {shipment.originCountry} → {shipment.destinationCountry}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCwIcon className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(shipment.trackingNumber)}>
                  <CopyIcon className="mr-2 h-4 w-4" />
                  Copy Tracking #
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {shipment.status !== "cancelled" && (
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">Cancel Shipment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Shipment</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this shipment? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Keep Active</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                      {deleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                      Cancel Shipment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-10 space-y-8">
        {/* Route strip */}
        <div className="flex items-center gap-6 py-6 px-8 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <MapPinIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Origin</p>
              <p className="text-sm font-semibold">{shipment.originCountry}</p>
            </div>
          </div>
          <div className="flex-1 flex items-center">
            <div className="flex-1 h-px bg-border" />
            <div className="mx-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <TruckIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Destination</p>
              <p className="text-sm font-semibold">{shipment.destinationCountry}</p>
            </div>
          </div>
          <div className="ml-auto pl-6 border-l">
            <Badge variant="outline" className="uppercase text-xs font-semibold px-3 py-1.5 tracking-wide">
              {shipment.carrierCode}
            </Badge>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          {/* Timeline */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClockIcon className="h-5 w-5 text-indigo-500" />
                  Tracking Timeline
                </CardTitle>
                {trackingEvents.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {trackingEvents.length} events
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {trackingEvents.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <div className="relative pl-8 pr-4">
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
                    {trackingEvents.map((event, index) => {
                      const isLatest = index === 0
                      return (
                        <div key={index} className="relative mb-8 last:mb-0">
                          <div className={`absolute left-[-20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-background ${
                            isLatest
                              ? "bg-emerald-500 ring-emerald-100 dark:ring-emerald-950"
                              : "bg-muted"
                          }`} />
                          <div className="bg-muted/30 rounded-lg p-4 border border-transparent hover:border-border transition-colors">
                            <p className={`text-sm font-medium leading-relaxed ${isLatest ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                              {event.description || "No description"}
                            </p>
                            {event.location && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                <MapPinIcon className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.date && (
                              <p className="text-xs text-muted-foreground mt-2 font-mono">
                                {new Date(event.date).toLocaleString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : isPendingFirstScan ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center mb-6">
                    <RotateCcwIcon className="h-9 w-9 text-amber-500" />
                  </div>
                  <p className="font-semibold text-lg text-amber-600 dark:text-amber-400 mb-2">Awaiting First Scan</p>
                  <p className="text-muted-foreground max-w-sm mb-4">
                    This shipment has been registered but the carrier has not yet scanned it.
                    The first tracking event usually appears within 24-48 hours after pickup.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ClockIcon className="h-3 w-3" />
                    <span>Expected first scan: within 24-48 hours of carrier pickup</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
                    <PackageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-muted-foreground">No tracking events</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Tracking updates will appear here once the carrier scans the shipment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PackageIcon className="h-4 w-4 text-emerald-500" />
                  Shipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <span className="text-sm text-muted-foreground">Tracking #</span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-center">
                    {shipment.trackingNumber}
                  </span>
                </div>
                <Separator />
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <span className="text-sm text-muted-foreground">White Label</span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-center">
                    {shipment.whiteLabelTrackingCode}
                  </span>
                </div>
                <Separator />
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <span className="text-sm text-muted-foreground">Goods Type</span>
                  <span className="text-sm capitalize font-medium">{shipment.goodsType}</span>
                </div>
                {shipment.weight && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                      <span className="text-sm text-muted-foreground">Weight</span>
                      <span className="text-sm font-medium">{shipment.weight} kg</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserIcon className="h-4 w-4 text-violet-500" />
                  Recipient
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <p className="font-semibold text-base">{shipment.recipientName}</p>
                <Separator />
                {shipment.recipientEmail && (
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${shipment.recipientEmail}`} className="text-sm text-primary hover:underline break-all">
                      {shipment.recipientEmail}
                    </a>
                  </div>
                )}
                {shipment.recipientPhone && (
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${shipment.recipientPhone}`} className="text-sm text-primary hover:underline">
                      {shipment.recipientPhone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarIcon className="h-4 w-4 text-amber-500" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">
                    {new Date(shipment.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
                  </span>
                </div>
                <Separator />
                <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                  <span className="text-sm text-muted-foreground">Updated</span>
                  <span className="text-sm font-medium">
                    {new Date(shipment.updatedAt).toLocaleDateString("en-US", { dateStyle: "long" })}
                  </span>
                </div>
                {shipment.deliveredAt && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                      <span className="text-sm text-muted-foreground">Delivered</span>
                      <span className="text-sm font-medium text-emerald-600">
                        {new Date(shipment.deliveredAt).toLocaleDateString("en-US", { dateStyle: "long" })}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={(open) => {
        setEditing(open)
        if (open && shipment) {
          setFormData({ recipientEmail: shipment.recipientEmail || "", recipientPhone: shipment.recipientPhone || "" })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shipment</DialogTitle>
            <DialogDescription>Update recipient contact information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, recipientEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.recipientPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, recipientPhone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
