"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  EditIcon,
  BuildingIcon,
  ShieldIcon,
  StoreIcon,
  MonitorIcon,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface UserProfile {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  organisationId: string
  branchId?: string | null
  createdAt: string
}

interface BranchInfo {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
}

interface Organisation {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  countryCode?: string
  logoUrl?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [branch, setBranch] = useState<BranchInfo | null>(null)

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }

    const fetchProfile = async () => {
      try {
        const userRes = await api.get<UserProfile>("/users/me")
        setUserProfile(userRes)

        if (authUser.organisationId) {
          const orgRes = await api.get<Organisation>(
            `/organisations/${authUser.organisationId}`
          )
          setOrganisation(orgRes)
        }

        if (userRes.branchId) {
          try {
            const branches = await api.get<BranchInfo[]>(
              `/organisations/${authUser.organisationId}/branches`
            )
            const found = branches.find(
              (b: BranchInfo) => b.id === userRes.branchId
            )
            if (found) setBranch(found)
          } catch (err) {
            console.error("Failed to load branch:", err)
          }
        }
      } catch (error) {
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [authUser, router])

  const roleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "staff":
        return "Staff"
      case "customer":
        return "Customer"
      default:
        return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-4 px-6">
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-48 rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (!userProfile) return null

  return (
    <div className="w-full space-y-0">
      <div className="relative h-48 overflow-hidden rounded-b-xl md:h-56">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cpattern id='p' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.3'/%3E%3Ccircle cx='50' cy='50' r='25' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='50' cy='50' r='10' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23p)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="absolute bottom-4 left-6 flex items-end gap-4">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg md:h-24 md:w-24">
            <AvatarImage src={userProfile.email} />
            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
              {userProfile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="mb-1 text-white">
            <h1 className="text-2xl font-bold md:text-3xl">
              {userProfile.name}
            </h1>
            <p className="text-white/80">{roleLabel(userProfile.role)}</p>
          </div>
        </div>

        <Link href="/profile/edit" className="absolute right-6 bottom-4">
          <Button variant="secondary" size="sm">
            <EditIcon className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="mx-auto max-w-6xl p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">About</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {userProfile.phoneNumber || "No phone number added"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined{" "}
                    {new Date(userProfile.createdAt).toLocaleDateString(
                      "en-IN",
                      { month: "long", year: "numeric" }
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Organisation</h3>
              {organisation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{organisation.name}</span>
                  </div>
                  {organisation.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <MailIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{organisation.email}</span>
                    </div>
                  )}
                  {organisation.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{organisation.phone}</span>
                    </div>
                  )}
                  {(organisation.city ||
                    organisation.state ||
                    organisation.countryCode) && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {[
                          organisation.city,
                          organisation.state,
                          organisation.countryCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <BuildingIcon className="h-4 w-4" />
                  <span>No organisation</span>
                </div>
              )}

              {(branch || userProfile.branchId) && (
                <>
                  <h3 className="mt-6 mb-4 text-lg font-semibold">Branch</h3>
                  {branch ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm">
                        <StoreIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{branch.name}</span>
                      </div>
                      {branch.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <MailIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{branch.email}</span>
                        </div>
                      )}
                      {branch.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{branch.phone}</span>
                        </div>
                      )}
                      {(branch.city || branch.state) && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {[branch.address, branch.city, branch.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <StoreIcon className="h-4 w-4" />
                      <span>Branch assigned</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Account</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <ShieldIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">
                    {roleLabel(userProfile.role)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Member since {new Date(userProfile.createdAt).getFullYear()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/profile/edit" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/settings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BuildingIcon className="mr-2 h-4 w-4" />
                    Organisation Settings
                  </Button>
                </Link>
                <Link href="/sessions" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MonitorIcon className="mr-2 h-4 w-4" />
                    Manage Sessions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
