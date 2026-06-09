"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { AnimatedPage } from "@/components/animated-page"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { StatsCard, StatsCardGrid } from "@/components/stats-card"
import {
  AlertCircleIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2,
  TruckIcon,
  ArrowLeftIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ScaleIcon,
  DollarSignIcon,
  ClockIcon,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  quoted: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  in_transit: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
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
  const canEdit = user?.role === "admin" || user?.id === userId

  const quotesTotalPages = Math.ceil(quotesTotal / ITEMS_PER_PAGE)
  const shipmentsTotalPages = Math.ceil(shipmentsTotal / ITEMS_PER_PAGE)

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    try {
      const profileData = await api.get<UserProfile>(`/users/${userId}`)
      setProfile(profileData)
    } catch (err) {
      toast.error("Failed to load user profile")
      setError("Failed to load user profile")
    }
  }, [userId])

  const fetchQuotes = useCallback(
    async (page: number) => {
      try {
        const p = new URLSearchParams()
        p.set("userId", userId)
        p.set("page", page.toString())
        p.set("limit", ITEMS_PER_PAGE.toString())
        const res = await api.get<PaginatedResponse<Quote>>(`/quotes?${p}`)
        setQuotes(res.data || [])
        setQuotesTotal(res.total || 0)
        setQuotesPage(page)
      } catch (err) {
        toast.error("Failed to fetch quotes")
      }
    },
    [userId]
  )

  const fetchShipments = useCallback(
    async (page: number) => {
      try {
        const p = new URLSearchParams()
        p.set("page", page.toString())
        p.set("limit", ITEMS_PER_PAGE.toString())
        p.set("userId", userId)
        const res = await api.get<PaginatedResponse<Shipment>>(
          `/shipments/user/${userId}?${p}`
        )
        setShipments(res.data || [])
        setShipmentsTotal(res.total || 0)
        setShipmentsPage(page)
      } catch (err) {
        toast.error("Failed to fetch shipments")
      }
    },
    [userId]
  )

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

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <AlertCircleIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">{error || "User not found"}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
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
    <AnimatedPage className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <Breadcrumbs
          items={[{ label: "Users", href: "/users" }, { label: profile.name }]}
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <StatsCardGrid>
        <StatsCard title="Total Quotes" value={quotesTotal} variant="minimal" />
        <StatsCard
          title="Pending"
          value={pendingQuotes}
          variant="minimal"
          className="[&_p:first-child]:text-amber-600"
        />
        <StatsCard
          title="Accepted"
          value={acceptedQuotes}
          variant="minimal"
          className="[&_p:first-child]:text-emerald-600"
        />
        <StatsCard title="Shipments" value={shipmentsTotal} variant="minimal" />
      </StatsCardGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {initials}
              </div>
              <h2 className="font-semibold">{profile.name}</h2>
              <Badge
                variant={profile.isActive ? "default" : "secondary"}
                className="mt-1"
              >
                {profile.isActive ? "Active" : "Inactive"}
              </Badge>
              <div className="mt-3 flex gap-2">
                <Badge variant="outline" className="bg-secondary/50">
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </Badge>
                {profile.emailVerified && (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    <CheckCircleIcon className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              {canEdit && (
                <Button size="sm" className="mt-4 w-full" asChild>
                  <Link href={`/users/${userId}/edit`}>Edit Profile</Link>
                </Button>
              )}
            </div>
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-3 text-sm">
                <MailIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground">
                  {profile.email}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <PhoneIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {profile.phoneNumber || "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Joined{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("quotes")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "quotes"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileTextIcon className="h-4 w-4" />
                Quotes
                <span className="ml-1 text-xs text-muted-foreground">
                  ({quotesTotal})
                </span>
              </button>
              <button
                onClick={() => setActiveTab("shipments")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "shipments"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <TruckIcon className="h-4 w-4" />
                Shipments
                <span className="ml-1 text-xs text-muted-foreground">
                  ({shipmentsTotal})
                </span>
              </button>
            </div>

            <div className="divide-y">
              {activeTab === "quotes"
                ? quotes.length === 0
                  ? emptyState(
                      <FileTextIcon className="h-10 w-10" />,
                      "No quotes yet"
                    )
                  : quotes.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {q.originCountry}
                              <span className="mx-1.5 text-muted-foreground">
                                →
                              </span>
                              {q.destinationCountry}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {q.goodsType}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              statusStyles[q.status] || statusStyles.pending
                            }
                          >
                            {q.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ScaleIcon className="h-3 w-3" /> {q.weight} kg
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSignIcon className="h-3 w-3" />{" "}
                            {q.price != null
                              ? q.price.toLocaleString()
                              : "Pending"}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />{" "}
                            {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                : shipments.length === 0
                  ? emptyState(
                      <TruckIcon className="h-10 w-10" />,
                      "No shipments yet"
                    )
                  : shipments.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <p className="font-medium">{s.trackingNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {s.carrier}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              statusStyles[s.status] || statusStyles.pending
                            }
                          >
                            {s.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3" /> {s.origin} →{" "}
                            {s.destination}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />{" "}
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}

              {activeTab === "quotes" && quotesTotalPages > 1 && (
                <div className="border-t p-4">
                  <Pagination
                    currentPage={quotesPage}
                    totalPages={quotesTotalPages}
                    totalItems={quotesTotal}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={(p) => fetchQuotes(p)}
                  />
                </div>
              )}
              {activeTab === "shipments" && shipmentsTotalPages > 1 && (
                <div className="border-t p-4">
                  <Pagination
                    currentPage={shipmentsPage}
                    totalPages={shipmentsTotalPages}
                    totalItems={shipmentsTotal}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={(p) => fetchShipments(p)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}

function emptyState(icon: React.ReactNode, text: string) {
  return (
    <div className="flex flex-col items-center py-12 text-muted-foreground">
      <div className="mb-3 opacity-30">{icon}</div>
      <p>{text}</p>
    </div>
  )
}
