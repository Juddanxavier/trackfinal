"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { getDialCode, prependCountryCode } from "@/lib/phone"
import { profileSchema, fieldErrors, type ProfileFormData } from "@/lib/validation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2Icon, SaveIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const { user: authUser, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({})
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
  })
  const [orgCountry, setOrgCountry] = useState("IN")

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }

    const fetchProfile = async () => {
      try {
        const userRes = await api.get<UserProfile>("/users/me")
        setFormData({
          name: userRes.name || "",
          phoneNumber: userRes.phoneNumber || "",
        })
        if (authUser.organisationId) {
          const org: any = await api.get(`/organisations/${authUser.organisationId}`)
          if (org?.countryCode) setOrgCountry(org.countryCode)
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [authUser, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = profileSchema.safeParse(formData)
    if (!result.success) {
      setErrors(fieldErrors<ProfileFormData>(result))
      return
    }
    setErrors({})
    setSaving(true)

    try {
      await api.put<UserProfile>("/users/me", result.data)
      await refreshUser()
      router.push("/profile")
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => { setErrors({ ...errors, name: undefined }); setFormData({ ...formData, name: e.target.value }) }}
                  placeholder="Your full name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={authUser?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => { setErrors({ ...errors, phoneNumber: undefined }); setFormData({ ...formData, phoneNumber: e.target.value }) }}
                onBlur={(e) => { const v = e.target.value; if (v) setFormData(f => ({ ...f, phoneNumber: prependCountryCode(v, orgCountry) })) }}
                placeholder={getDialCode(orgCountry) + " 9000000000"}
              />
                {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Link href="/profile">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4 mr-2" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}