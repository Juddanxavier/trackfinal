"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { cn } from "@/lib/utils"
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  TruckIcon,
  PackageIcon,
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
  Loader2Icon,
  AlertCircleIcon,
  Trash2Icon,
  CopyIcon,
  GlobeIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircle2Icon,
  CircleIcon,
  TimerIcon,
  XCircleIcon,
  Building2Icon,
  HashIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

const countryNameToCode: Record<string, string> = {
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Andorra: "AD",
  Angola: "AO",
  "Antigua and Barbuda": "AG",
  Argentina: "AR",
  Armenia: "AM",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  Bahamas: "BS",
  Bahrain: "BH",
  Bangladesh: "BD",
  Barbados: "BB",
  Belarus: "BY",
  Belgium: "BE",
  Belize: "BZ",
  Benin: "BJ",
  Bhutan: "BT",
  Bolivia: "BO",
  Bosnia: "BA",
  Botswana: "BW",
  Brazil: "BR",
  Brunei: "BN",
  Bulgaria: "BG",
  "Burkina Faso": "BF",
  Burundi: "BI",
  Cambodia: "KH",
  Cameroon: "CM",
  Canada: "CA",
  "Cape Verde": "CV",
  "Central African Republic": "CF",
  Chad: "TD",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  Comoros: "KM",
  Congo: "CG",
  "Costa Rica": "CR",
  Croatia: "HR",
  Cuba: "CU",
  Cyprus: "CY",
  "Czech Republic": "CZ",
  "DR Congo": "CD",
  "Democratic Republic of the Congo": "CD",
  Denmark: "DK",
  Djibouti: "DJ",
  Dominica: "DM",
  "Dominican Republic": "DO",
  "Timor-Leste": "TL",
  "East Timor": "TL",
  Ecuador: "EC",
  Egypt: "EG",
  "El Salvador": "SV",
  "Equatorial Guinea": "GQ",
  Eritrea: "ER",
  Estonia: "EE",
  Eswatini: "SZ",
  Ethiopia: "ET",
  Fiji: "FJ",
  Finland: "FI",
  France: "FR",
  Gabon: "GA",
  Gambia: "GM",
  Georgia: "GE",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Grenada: "GD",
  Guatemala: "GT",
  Guinea: "GN",
  "Guinea-Bissau": "GW",
  Guyana: "GY",
  Haiti: "HT",
  Honduras: "HN",
  Hungary: "HU",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  "Ivory Coast": "CI",
  "Cote d'Ivoire": "CI",
  Jamaica: "JM",
  Japan: "JP",
  Jordan: "JO",
  Kazakhstan: "KZ",
  Kenya: "KE",
  Kiribati: "KI",
  Kosovo: "XK",
  Kuwait: "KW",
  Kyrgyzstan: "KG",
  Laos: "LA",
  Latvia: "LV",
  Lebanon: "LB",
  Lesotho: "LS",
  Liberia: "LR",
  Libya: "LY",
  Liechtenstein: "LI",
  Lithuania: "LT",
  Luxembourg: "LU",
  Madagascar: "MG",
  Malawi: "MW",
  Malaysia: "MY",
  Maldives: "MV",
  Mali: "ML",
  Malta: "MT",
  "Marshall Islands": "MH",
  Mauritania: "MR",
  Mauritius: "MU",
  Mexico: "MX",
  Micronesia: "FM",
  Moldova: "MD",
  Monaco: "MC",
  Mongolia: "MN",
  Montenegro: "ME",
  Morocco: "MA",
  Mozambique: "MZ",
  Myanmar: "MM",
  Namibia: "NA",
  Nauru: "NR",
  Nepal: "NP",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Nicaragua: "NI",
  Niger: "NE",
  Nigeria: "NG",
  "North Korea": "KP",
  "North Macedonia": "MK",
  Norway: "NO",
  Oman: "OM",
  Pakistan: "PK",
  Palau: "PW",
  Palestine: "PS",
  Panama: "PA",
  "Papua New Guinea": "PG",
  Paraguay: "PY",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Romania: "RO",
  Russia: "RU",
  "Russian Federation": "RU",
  Rwanda: "RW",
  "Saint Kitts": "KN",
  "Saint Lucia": "LC",
  "Saint Vincent": "VC",
  Samoa: "WS",
  "San Marino": "SM",
  "Sao Tome": "ST",
  "Saudi Arabia": "SA",
  Senegal: "SN",
  Serbia: "RS",
  Seychelles: "SC",
  "Sierra Leone": "SL",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  "Solomon Islands": "SB",
  Somalia: "SO",
  "South Africa": "ZA",
  "South Korea": "KR",
  "South Sudan": "SS",
  Spain: "ES",
  "Sri Lanka": "LK",
  Sudan: "SD",
  Suriname: "SR",
  Sweden: "SE",
  Switzerland: "CH",
  Syria: "SY",
  Taiwan: "TW",
  Tajikistan: "TJ",
  Tanzania: "TZ",
  Thailand: "TH",
  Togo: "TG",
  Tonga: "TO",
  Trinidad: "TT",
  Tunisia: "TN",
  Turkey: "TR",
  Turkmenistan: "TM",
  Tuvalu: "TV",
  Uganda: "UG",
  Ukraine: "UA",
  UAE: "AE",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  USA: "US",
  Uruguay: "UY",
  Uzbekistan: "UZ",
  Vanuatu: "VU",
  "Vatican City": "VA",
  Venezuela: "VE",
  Vietnam: "VN",
  Yemen: "YE",
  Zambia: "ZM",
  Zimbabwe: "ZW",
  "Hong Kong": "HK",
  Macao: "MO",
}

function CountryFlag({
  countryName,
  size = 20,
}: {
  countryName?: string
  size?: number
}) {
  if (!countryName) return <span className="text-muted-foreground">—</span>
  const code =
    countryNameToCode[countryName] ||
    countryNameToCode[countryName.toLowerCase()]
  return (
    <span className="inline-flex items-center gap-1.5">
      {code && (
        <img
          src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
          alt={countryName}
          width={size}
          height={size * 0.75}
          className="rounded-sm object-cover"
        />
      )}
      <span>{countryName}</span>
    </span>
  )
}

type ShipmentStatus =
  | "pending"
  | "in_transit"
  | "delivered"
  | "exception"
  | "cancelled"

interface ShipmentEvent {
  id: string
  status: string
  statusRaw?: string
  description?: string
  location?: string
  eventTime: string
}

interface Shipment {
  id: string
  trackingNumber: string
  whiteLabelTrackingCode?: string
  carrierCode: string
  carrierName?: string
  status: ShipmentStatus
  recipientName: string
  recipientEmail?: string
  recipientPhone?: string
  recipientAddress?: string
  originCountry?: string
  destinationCountry?: string
  track17Data?: {
    origin_country?: string
    destination_country?: string
    tracking?: {
      checkpoints?: Array<{
        checkpoint_time?: string
        location?: string
        status?: string
        message?: string
      }>
    }
    lastSync?: string
  }
  createdAt: string
  updatedAt: string
  deliveredAt?: string
  events?: ShipmentEvent[]
}

const timelineIcons: Record<string, React.ReactNode> = {
  delivered: <CheckCircle2Icon className="h-4 w-4 text-green-500" />,
  in_transit: <TruckIcon className="h-4 w-4 text-blue-500" />,
  exception: <AlertCircleIcon className="h-4 w-4 text-red-500" />,
  pending: <ClockIcon className="h-4 w-4 text-amber-500" />,
  cancelled: <XCircleIcon className="h-4 w-4 text-muted-foreground" />,
  info: <CircleIcon className="h-4 w-4 text-muted-foreground" />,
}

function getTimelineIcon(status: string): React.ReactNode {
  const key = Object.keys(timelineIcons).find((k) =>
    status.toLowerCase().includes(k)
  )
  return timelineIcons[key || "info"]
}

export default function ShipmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shipmentId = params.id as string

  const fetchShipment = useCallback(async () => {
    if (!shipmentId) return
    try {
      const res = await api.get<Shipment>(`/shipments/${shipmentId}`)
      setShipment(res)
    } catch {
      toast.error("Failed to load shipment")
      setError("Failed to load shipment")
    }
  }, [shipmentId])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError(null)
      await fetchShipment()
      setLoading(false)
    }
    init()
  }, [fetchShipment])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await api.post<{ success: boolean }>(
        `/tracking/sync/${shipmentId}`,
        {},
        { throwOnError: false }
      )
      if (res?.success) await fetchShipment()
    } catch {
      toast.error("Failed to sync shipment")
    } finally {
      setSyncing(false)
    }
  }

  const handleRegister = async () => {
    setRegistering(true)
    try {
      const res = await api.post<{ success: boolean }>(
        `/tracking/register/${shipmentId}`,
        {},
        { throwOnError: false }
      )
      if (res?.success) await fetchShipment()
    } catch {
      toast.error("Failed to register shipment")
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/shipments/${shipmentId}`, { throwOnError: false })
      router.push("/shipments")
    } catch {
      toast.error("Failed to delete shipment")
    } finally {
      setDeleting(false)
    }
  }

  const copyTracking = async () => {
    if (!shipment) return
    try {
      await navigator.clipboard.writeText(shipment.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <Skeleton className="h-64 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 w-fit text-muted-foreground"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <AlertCircleIcon className="size-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold">
            {error || "Shipment not found"}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig: Record<
    ShipmentStatus,
    {
      variant: "default" | "secondary" | "destructive" | "outline"
      label: string
    }
  > = {
    pending: { variant: "secondary", label: "Pending" },
    in_transit: { variant: "default", label: "In Transit" },
    delivered: { variant: "default", label: "Delivered" },
    exception: { variant: "destructive", label: "Exception" },
    cancelled: { variant: "outline", label: "Cancelled" },
  }

  const status = statusConfig[shipment.status] || statusConfig.pending
  const events = shipment.events || []
  const lastSync = shipment.track17Data?.lastSync
    ? new Date(shipment.track17Data.lastSync)
    : null

  return (
    <div className="space-y-6 p-6">
      <Breadcrumbs
        items={[
          { label: "Shipments", href: "/shipments" },
          { label: shipment.trackingNumber },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <PackageIcon className="size-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold tracking-tight">
                {shipment.trackingNumber}
              </h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {shipment.carrierName ||
                shipment.carrierCode ||
                "Unknown carrier"}{" "}
              &middot; Created{" "}
              {new Date(shipment.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-muted-foreground"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCwIcon
              className={cn("mr-2 h-4 w-4", syncing && "animate-spin")}
            />
            Sync
          </Button>
          {shipment.status === "pending" && (
            <Button onClick={handleRegister} disabled={registering}>
              <TruckIcon
                className={cn("mr-2 h-4 w-4", registering && "animate-spin")}
              />
              Register
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClockIcon className="size-4 text-muted-foreground" />
                Tracking Timeline
              </CardTitle>
              <CardDescription>
                {events.length > 0
                  ? `${events.length} tracking event${events.length > 1 ? "s" : ""}`
                  : "No tracking events recorded"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="relative space-y-0">
                  {events.map((event, idx) => (
                    <div
                      key={event.id}
                      className="relative flex gap-4 pb-8 last:pb-0"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                          {getTimelineIcon(event.status)}
                        </div>
                        {idx < events.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {event.description ||
                              event.statusRaw ||
                              event.status}
                          </p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(event.eventTime).toLocaleString()}
                          </span>
                        </div>
                        {event.location && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPinIcon className="size-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <PackageIcon className="size-6 text-muted-foreground/60" />
                  </div>
                  <p className="mt-4 text-sm font-semibold">
                    No tracking events yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Register with 17TRACK to start receiving updates
                  </p>
                  {shipment.status === "pending" && (
                    <Button
                      onClick={handleRegister}
                      disabled={registering}
                      className="mt-4"
                    >
                      <TruckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          registering && "animate-spin"
                        )}
                      />
                      Register with 17TRACK
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <HashIcon className="size-4 text-muted-foreground" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                <span className="text-xs text-muted-foreground">
                  Tracking #
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-medium">
                    {shipment.trackingNumber}
                  </span>
                  <button
                    onClick={copyTracking}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied ? (
                      <CheckCircle2Icon className="size-3.5 text-green-500" />
                    ) : (
                      <CopyIcon className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
              {shipment.whiteLabelTrackingCode && (
                <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                  <span className="text-xs text-muted-foreground">
                    White Label
                  </span>
                  <span className="font-mono text-sm font-medium">
                    {shipment.whiteLabelTrackingCode}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                <span className="text-xs text-muted-foreground">Carrier</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <TruckIcon className="size-3.5 text-muted-foreground" />
                  {shipment.carrierName || shipment.carrierCode || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                <span className="text-xs text-muted-foreground">Origin</span>
                <span className="text-sm font-medium">
                  <CountryFlag countryName={shipment.originCountry} />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                <span className="text-xs text-muted-foreground">
                  Destination
                </span>
                <span className="text-sm font-medium">
                  <CountryFlag countryName={shipment.destinationCountry} />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <CalendarIcon className="size-3.5 text-muted-foreground" />
                  {new Date(shipment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                <span className="text-xs text-muted-foreground">Last Sync</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {lastSync ? (
                    <>
                      <ClockIcon className="size-3.5 text-muted-foreground" />
                      {lastSync.toLocaleString()}
                    </>
                  ) : (
                    "Never"
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon className="size-4 text-muted-foreground" />
                Recipient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-md bg-muted/30 p-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <UserIcon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">
                    {shipment.recipientName}
                  </p>
                </div>
              </div>
              {shipment.recipientEmail && (
                <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                    <MailIcon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{shipment.recipientEmail}</p>
                  </div>
                </div>
              )}
              {shipment.recipientPhone && (
                <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                    <PhoneIcon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-mono text-sm">
                      {shipment.recipientPhone}
                    </p>
                  </div>
                </div>
              )}
              {shipment.recipientAddress && (
                <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                    <MapPinIcon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm">{shipment.recipientAddress}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shipment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleDelete()
                setDeleteDialogOpen(false)
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
