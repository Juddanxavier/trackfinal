"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { AlertCircleIcon, FileTextIcon, CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon, Loader2, TruckIcon, ArrowLeftIcon, MailIcon, PhoneIcon, MapPinIcon, EditIcon, TrashIcon, UserPlusIcon, CalendarIcon, PackageIcon, CopyIcon, ScaleIcon, DollarSignIcon, ClockIcon } from 'lucide-react'
import Link from "next/link"

interface UserProfile {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  organisationId: string
  emailVerified: boolean
  createdAt: string
}

interface Quote {
  id: string
  originCountry: string
  destinationCountry: string
  goodsType: string
  weight: number
  status: string
  price: number | null
  createdAt: string
}

interface Shipment {
  id: string
  trackingNumber: string
  origin: string
  destination: string
  status: string
  carrier: string
  createdAt: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", icon: <AlertCircleIcon className="h-4 w-4" /> },
  quoted: { bg: "bg-blue-50", text: "text-blue-700", icon: <FileTextIcon className="h-4 w-4" /> },
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircleIcon className="h-4 w-4" /> },
  rejected: { bg: "bg-red-50", text: "text-red-700", icon: <XCircleIcon className="h-4 w-4" /> },
  in_transit: { bg: "bg-purple-50", text: "text-purple-700", icon: <TruckIcon className="h-4 w-4" /> },
  delivered: { bg: "bg-green-50", text: "text-green-700", icon: <CheckCircleIcon className="h-4 w-4" /> },
}

const ITEMS_PER_PAGE = 5

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [quotesTotal, setQuotesTotal] = useState(0)
  const [shipmentsTotal, setShipmentsTotal] = useState(0)
  const [quotesPage, setQuotesPage] = useState(1)
  const [shipmentsPage, setShipmentsPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"quotes" | "shipments">("quotes")

  const userId = params.id as string
  const isOwnProfile = user?.id === userId
  const canEdit = user?.role === "admin" || isOwnProfile

  const quotesTotalPages = Math.ceil(quotesTotal / ITEMS_PER_PAGE)
  const shipmentsTotalPages = Math.ceil(shipmentsTotal / ITEMS_PER_PAGE)

  const fetchProfile = useCallback(async () => {
    if (!userId) return

    try {
      const profileData = await api.get<UserProfile>(`/users/${userId}`)
      setProfile(profileData)
    } catch (err) {
      console.error("Failed to load user profile:", err)
      setError("Failed to load user profile")
    }
  }, [userId])

  const fetchQuotes = useCallback(async (page: number) => {
    try {
      const params = new URLSearchParams()
      params.set("userId", userId)
      params.set("page", page.toString())
      params.set("limit", ITEMS_PER_PAGE.toString())
      const res = await api.get<PaginatedResponse<Quote>>(`/quotes?${params}`)
      setQuotes(res.data || [])
      setQuotesTotal(res.total || 0)
      setQuotesPage(page)
    } catch (err) {
      console.error("Failed to fetch quotes:", err)
    }
  }, [userId])

  const fetchShipments = useCallback(async (page: number) => {
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", ITEMS_PER_PAGE.toString())
      params.set("userId", userId)
      const res = await api.get<{ data: Shipment[]; total: number; page: number; limit: number; totalPages: number }>(`/shipments/customer/${userId}?${params}`)
      setShipments(res.data || [])
      setShipmentsTotal(res.total || 0)
      setShipmentsPage(page)
    } catch (err) {
      console.error("Failed to fetch shipments:", err)
    }
  }, [userId])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError(null)
      await fetchProfile()
      await Promise.all([fetchQuotes(1), fetchShipments(1)])
      setLoading(false)
    }
    init()
  }, [fetchProfile, fetchQuotes, fetchShipments])

  const handleTabChange = (tab: "quotes" | "shipments") => {
    setActiveTab(tab)
  }

  const handleQuotesPageChange = (newPage: number) => {
    fetchQuotes(newPage)
  }

  const handleShipmentsPageChange = (newPage: number) => {
    fetchShipments(newPage)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <AlertCircleIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{error || "User not found"}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const acceptedQuotes = quotes.filter((q) => q.status === "accepted").length
  const pendingQuotes = quotes.filter((q) => q.status === "pending").length

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="size-24 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                {initials}
              </div>
              {profile.isActive && (
                <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-green-500 border-4 border-background" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
                <Badge
                  variant={profile.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {profile.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {canEdit && (
                <Button asChild>
                  <Link href={`/users/${userId}/edit`}>Edit Profile</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent" />
              <div className="relative">
                <p className="text-3xl font-bold text-white">{quotesTotal}</p>
                <p className="text-sm text-white/80">Total Quotes</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent" />
              <div className="relative">
                <p className="text-3xl font-bold text-white">{pendingQuotes}</p>
                <p className="text-sm text-white/80">Pending</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
              <div className="relative">
                <p className="text-3xl font-bold text-white">{acceptedQuotes}</p>
                <p className="text-sm text-white/80">Accepted</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent" />
              <div className="relative">
                <p className="text-3xl font-bold text-white">{shipmentsTotal}</p>
                <p className="text-sm text-white/80">Shipments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Contact Card */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <MailIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <PhoneIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{profile.phoneNumber || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium">
                      {new Date(profile.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges Card */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Account Status</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-secondary/50">
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </Badge>
                {profile.emailVerified && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Email Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Custom Tabs */}
          <div className="lg:col-span-8">
            <div className="bg-card rounded-xl border overflow-hidden">
              {/* Tab Header - Pill Style */}
              <div className="flex gap-2 p-4 border-b">
                <button
                  onClick={() => handleTabChange("quotes")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "quotes"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileTextIcon className="h-4 w-4" />
                  Quotes
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === "quotes"
                      ? "bg-primary-foreground/20"
                      : "bg-background/50"
                  }`}>
                    {quotesTotal}
                  </span>
                </button>
                <button
                  onClick={() => handleTabChange("shipments")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "shipments"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TruckIcon className="h-4 w-4" />
                  Shipments
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === "shipments"
                      ? "bg-primary-foreground/20"
                      : "bg-background/50"
                  }`}>
                    {shipmentsTotal}
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "quotes" ? (
                  quotes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-medium">No quotes yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quotes will appear here once created
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {quotes.map((quote) => {
                          const status = statusConfig[quote.status] || statusConfig.pending
                          return (
                            <div
                              key={quote.id}
                              className="rounded-lg border p-5 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`size-10 rounded-lg ${status.bg} flex items-center justify-center`}>
                                    <MapPinIcon className={`h-5 w-5 ${status.text}`} />
                                  </div>
                                  <div>
                                    <p className="font-semibold">
                                      {quote.originCountry}
                                      <span className="mx-2 text-muted-foreground">→</span>
                                      {quote.destinationCountry}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{quote.goodsType}</p>
                                  </div>
                                </div>
                                <Badge className={`${status.bg} ${status.text}`}>
                                  {status.icon}
                                  <span className="ml-1">{quote.status.replace("_", " ")}</span>
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Weight</p>
                                  <p className="text-sm font-medium flex items-center gap-1">
                                    <ScaleIcon className="h-3 w-3" />
                                    {quote.weight} kg
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Price</p>
                                  <p className="text-sm font-medium flex items-center gap-1">
                                    <DollarSignIcon className="h-3 w-3" />
                                    {quote.price ? quote.price.toLocaleString() : "Pending"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                                  <p className="text-sm font-medium flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" />
                                    {new Date(quote.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                                  <p className="text-sm font-medium capitalize">
                                    {quote.status.replace("_", " ")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Pagination */}
                      {quotesTotalPages > 1 && (
                        <Pagination
                          currentPage={quotesPage}
                          totalPages={quotesTotalPages}
                          totalItems={quotesTotal}
                          itemsPerPage={ITEMS_PER_PAGE}
                          onPageChange={handleQuotesPageChange}
                        />
                      )}
                    </>
                  )
                ) : shipments.length === 0 ? (
                  <div className="text-center py-12">
                    <TruckIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium">No shipments yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Shipments will appear here once created
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {shipments.map((shipment) => {
                        const status = statusConfig[shipment.status] || statusConfig.pending
                        return (
                          <div
                            key={shipment.id}
                            className="rounded-lg border p-5 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-lg ${status.bg} flex items-center justify-center`}>
                                  <TruckIcon className={`h-5 w-5 ${status.text}`} />
                                </div>
                                <div>
                                  <p className="font-semibold">{shipment.trackingNumber}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {shipment.carrier}
                                  </p>
                                </div>
                              </div>
                              <Badge className={`${status.bg} ${status.text}`}>
                                {status.icon}
                                <span className="ml-1">{shipment.status.replace("_", " ")}</span>
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Route</p>
                                <p className="text-sm font-medium flex items-center gap-1">
                                  <MapPinIcon className="h-3 w-3" />
                                  {shipment.origin} → {shipment.destination}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Carrier</p>
                                <p className="text-sm font-medium">{shipment.carrier}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Created</p>
                                <p className="text-sm font-medium flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  {new Date(shipment.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Pagination */}
                    {shipmentsTotalPages > 1 && (
                      <Pagination
                        currentPage={shipmentsPage}
                        totalPages={shipmentsTotalPages}
                        totalItems={shipmentsTotal}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={handleShipmentsPageChange}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}