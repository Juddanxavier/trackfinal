"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  MailIcon, 
  PhoneIcon, 
  MapPinIcon, 
  CalendarIcon, 
  EditIcon,
  BuildingIcon,
  ShieldIcon,
} from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  organisationId: string
  createdAt: string
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

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }

    const fetchProfile = async () => {
      try {
        const [userRes, orgRes] = await Promise.all([
          api.get<UserProfile>("/users/me"),
          authUser.organisationId 
            ? api.get<Organisation>(`/organisations/${authUser.organisationId}`)
            : Promise.resolve(null)
        ])
        setUserProfile(userRes)
        setOrganisation(orgRes)
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [authUser, router])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-muted animate-pulse" />
        <div className="px-6 space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!userProfile) return null

  return (
    <div className="w-full space-y-0">
      <div className="relative h-48 md:h-64 overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)`,
          }}
        />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cpattern id='p' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.3'/%3E%3Ccircle cx='50' cy='50' r='25' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='50' cy='50' r='10' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23p)'/%3E%3C/svg%3E")`,
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        <div className="absolute bottom-4 left-6 flex items-end gap-4">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-lg">
            <AvatarImage src={userProfile.email} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {userProfile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-white mb-1">
            <h1 className="text-2xl md:text-3xl font-bold">{userProfile.name}</h1>
            <p className="text-white/80 capitalize">{userProfile.role}</p>
          </div>
        </div>
        
        <Link href="/profile/edit" className="absolute bottom-4 right-6">
          <Button variant="secondary" size="sm">
            <EditIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4">About</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{userProfile.phoneNumber || "No phone number added"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(userProfile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4">Organisation</h3>
              {organisation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{organisation.name}</span>
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
                  {(organisation.city || organisation.state || organisation.countryCode) && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {[organisation.city, organisation.state, organisation.countryCode].filter(Boolean).join(", ")}
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
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4">Account</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <ShieldIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{userProfile.role}</span>
                </div>
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Member since {new Date(userProfile.createdAt).getFullYear()}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/profile/edit" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/settings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BuildingIcon className="h-4 w-4 mr-2" />
                    Organisation Settings
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