"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReactCountryFlag from "react-country-flag"
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
} from "lucide-react"

const countryNameToCode: Record<string, string> = {
  "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Andorra": "AD", "Angola": "AO", "Antigua and Barbuda": "AG", "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT", "Azerbaijan": "AZ",
  "Bahamas": "BS", "Bahrain": "BH", "Bangladesh": "BD", "Barbados": "BB", "Belarus": "BY", "Belgium": "BE", "Belize": "BZ", "Benin": "BJ", "Bhutan": "BT", "Bolivia": "BO", "Bosnia": "BA", "Botswana": "BW", "Brazil": "BR", "Brunei": "BN", "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI",
  "Cambodia": "KH", "Cameroon": "CM", "Canada": "CA", "Cape Verde": "CV", "Central African Republic": "CF", "Chad": "TD", "Chile": "CL", "China": "CN", "Colombia": "CO", "Comoros": "KM", "Congo": "CG", "Costa Rica": "CR", "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY", "Czech Republic": "CZ",
  "DR Congo": "CD", "Democratic Republic of the Congo": "CD", "Denmark": "DK", "Djibouti": "DJ", "Dominica": "DM", "Dominican Republic": "DO",
  "Timor-Leste": "TL", "East Timor": "TL", "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "Equatorial Guinea": "GQ", "Eritrea": "ER", "Estonia": "EE", "Eswatini": "SZ", "Ethiopia": "ET",
  "Fiji": "FJ", "Finland": "FI", "France": "FR",
  "Gabon": "GA", "Gambia": "GM", "Georgia": "GE", "Germany": "DE", "Ghana": "GH", "Greece": "GR", "Grenada": "GD", "Guatemala": "GT", "Guinea": "GN", "Guinea-Bissau": "GW", "Guyana": "GY",
  "Haiti": "HT", "Honduras": "HN", "Hungary": "HU",
  "Iceland": "IS", "India": "IN", "Indonesia": "ID", "Iran": "IR", "Iraq": "IQ", "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Ivory Coast": "CI", "Cote d'Ivoire": "CI",
  "Jamaica": "JM", "Japan": "JP", "Jordan": "JO",
  "Kazakhstan": "KZ", "Kenya": "KE", "Kiribati": "KI", "Kosovo": "XK", "Kuwait": "KW", "Kyrgyzstan": "KG",
  "Laos": "LA", "Latvia": "LV", "Lebanon": "LB", "Lesotho": "LS", "Liberia": "LR", "Libya": "LY", "Liechtenstein": "LI", "Lithuania": "LT", "Luxembourg": "LU",
  "Madagascar": "MG", "Malawi": "MW", "Malaysia": "MY", "Maldives": "MV", "Mali": "ML", "Malta": "MT", "Marshall Islands": "MH", "Mauritania": "MR", "Mauritius": "MU", "Mexico": "MX", "Micronesia": "FM", "Moldova": "MD", "Monaco": "MC", "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA", "Mozambique": "MZ", "Myanmar": "MM",
  "Namibia": "NA", "Nauru": "NR", "Nepal": "NP", "Netherlands": "NL", "New Zealand": "NZ", "Nicaragua": "NI", "Niger": "NE", "Nigeria": "NG", "North Korea": "KP", "North Macedonia": "MK", "Norway": "NO",
  "Oman": "OM",
  "Pakistan": "PK", "Palau": "PW", "Palestine": "PS", "Panama": "PA", "Papua New Guinea": "PG", "Paraguay": "PY", "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT",
  "Qatar": "QA",
  "Romania": "RO", "Russia": "RU", "Russian Federation": "RU", "Rwanda": "RW",
  "Saint Kitts": "KN", "Saint Lucia": "LC", "Saint Vincent": "VC", "Samoa": "WS", "San Marino": "SM", "Sao Tome": "ST", "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS", "Seychelles": "SC", "Sierra Leone": "SL", "Singapore": "SG", "Slovakia": "SK", "Slovenia": "SI", "Solomon Islands": "SB", "Somalia": "SO", "South Africa": "ZA", "South Korea": "KR", "South Sudan": "SS", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD", "Suriname": "SR", "Sweden": "SE", "Switzerland": "CH", "Syria": "SY",
  "Taiwan": "TW", "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH", "Togo": "TG", "Tonga": "TO", "Trinidad": "TT", "Tunisia": "TN", "Turkey": "TR", "Turkmenistan": "TM", "Tuvalu": "TV",
  "Uganda": "UG", "Ukraine": "UA", "UAE": "AE", "United Arab Emirates": "AE", "United Kingdom": "GB", "United States": "US", "USA": "US", "Uruguay": "UY", "Uzbekistan": "UZ",
  "Vanuatu": "VU", "Vatican City": "VA", "Venezuela": "VE", "Vietnam": "VN",
  "Yemen": "YE",
  "Zambia": "ZM", "Zimbabwe": "ZW",
  "Hong Kong": "HK", "Macao": "MO",
}

function CountryDisplay({ countryName }: { countryName: string | undefined }) {
  if (!countryName) return <span className="text-muted-foreground">Unknown</span>
  const code = countryNameToCode[countryName] || countryNameToCode[countryName.toLowerCase()]
  if (!code) return <span>{countryName}</span>
  return (
    <span className="flex items-center gap-1.5">
      <ReactCountryFlag countryCode={code} svg style={{ width: '1.5em', height: '1.5em' }} title={countryName} />
      {countryName}
    </span>
  )
}

type ShipmentStatus = "pending" | "in_transit" | "delivered" | "exception" | "cancelled"

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
  track17Data?: any
  createdAt: string
  updatedAt: string
  deliveredAt?: string
  events?: ShipmentEvent[]
}

const statusConfig: Record<ShipmentStatus, { variant: string; label: string }> = {
  pending: { variant: "secondary", label: "Pending" },
  in_transit: { variant: "default", label: "In Transit" },
  delivered: { variant: "default", label: "Delivered" },
  exception: { variant: "destructive", label: "Exception" },
  cancelled: { variant: "outline", label: "Cancelled" },
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

  const shipmentId = params.id as string

  const fetchShipment = useCallback(async () => {
    if (!shipmentId) return
    try {
      const res = await api.get<Shipment>(`/shipments/${shipmentId}`)
      setShipment(res)
    } catch (err) {
      console.error("Failed to fetch shipment:", err)
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
      const res = await api.post<{ success: boolean }>(`/tracking/sync/${shipmentId}`, {}, { throwOnError: false })
      if (res?.success) {
        await fetchShipment()
      }
    } catch (err) {
      console.error("Failed to sync:", err)
    } finally {
      setSyncing(false)
    }
  }

  const handleRegister = async () => {
    setRegistering(true)
    try {
      const res = await api.post<{ success: boolean }>(`/tracking/register/${shipmentId}`, {}, { throwOnError: false })
      if (res?.success) {
        await fetchShipment()
      }
    } catch (err) {
      console.error("Failed to register:", err)
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this shipment?")) return
    setDeleting(true)
    try {
      await api.delete(`/shipments/${shipmentId}`, { throwOnError: false })
      router.push('/shipments')
    } catch (err) {
      console.error("Failed to delete:", err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircleIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{error || "Shipment not found"}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const status = statusConfig[shipment.status] || statusConfig.pending

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono">{shipment.trackingNumber}</h1>
                <Badge variant={status.variant as any}>{status.label}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground">
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button variant="outline" onClick={handleSync} disabled={syncing}>
                  {syncing ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCwIcon className="mr-2 h-4 w-4" />}
                  Sync
                </Button>
                {shipment.status === "pending" && (
                  <Button onClick={handleRegister} disabled={registering}>
                    {registering ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <TruckIcon className="mr-2 h-4 w-4" />}
                    Register
                  </Button>
                )}
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <Trash2Icon className="mr-2 h-4 w-4" />}
                  Delete
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {shipment.carrierName || shipment.carrierCode || "Unknown"} • Created {new Date(shipment.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="rounded-lg border bg-card">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PackageIcon className="h-4 w-4" />
                      Tracking Timeline
                    </CardTitle>
                  </div>
                  <CardContent className="p-6 pt-0">
                    {shipment.events && shipment.events.length > 0 ? (
                      <div className="relative border-l-2 border-muted ml-3 space-y-6">
                        {shipment.events.map((event) => (
                          <div key={event.id} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background bg-muted" />
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {event.statusRaw || event.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(event.eventTime).toLocaleString()}
                                </span>
                              </div>
                              {event.description && (
                                <p className="text-sm">{event.description}</p>
                              )}
                              {event.location && (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPinIcon className="h-3 w-3" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="font-medium">No tracking events yet</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Register with 17TRACK to start receiving updates
                        </p>
                        {shipment.status === "pending" && (
                          <Button onClick={handleRegister} disabled={registering}>
                            {registering ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <TruckIcon className="mr-2 h-4 w-4" />}
                            Register with 17TRACK
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border bg-card">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TruckIcon className="h-4 w-4" />
                      Details
                    </CardTitle>
                  </div>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Tracking #</span>
                      <span className="text-sm font-medium font-mono">{shipment.trackingNumber}</span>
                    </div>
                    {shipment.whiteLabelTrackingCode && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">White Label Code</span>
                        <span className="text-sm font-medium font-mono">{shipment.whiteLabelTrackingCode}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Carrier</span>
                      <span className="text-sm font-medium">{shipment.carrierName || shipment.carrierCode || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Origin</span>
                      <span className="text-sm font-medium"><CountryDisplay countryName={shipment.originCountry} /></span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Destination</span>
                      <span className="text-sm font-medium"><CountryDisplay countryName={shipment.destinationCountry} /></span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm font-medium">{new Date(shipment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Last Sync</span>
                      <span className="text-sm font-medium">
                        {shipment.track17Data?.lastSync ? new Date(shipment.track17Data.lastSync).toLocaleString() : "Never"}
                      </span>
                    </div>
                  </CardContent>
                </div>

                <div className="rounded-lg border bg-card">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Recipient
                    </CardTitle>
                  </div>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-medium">{shipment.recipientName}</p>
                      </div>
                    </div>
                    {shipment.recipientEmail && (
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <MailIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{shipment.recipientEmail}</p>
                        </div>
                      </div>
                    )}
                    {shipment.recipientPhone && (
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{shipment.recipientPhone}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}