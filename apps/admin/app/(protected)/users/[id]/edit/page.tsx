"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { getDialCode, prependCountryCode } from "@/lib/phone"
import {
  userEditSchema,
  fieldErrors,
  type ProfileFormData,
} from "@/lib/validation"
import { isAdminRole } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  organisationId: string
}

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFormData, string>>
  >({})
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [role, setRole] = useState("")
  const [orgCountry, setOrgCountry] = useState("IN")

  const userId = params.id as string
  const isOwnProfile = currentUser?.id === userId
  const isAdmin = isAdminRole(currentUser?.role)
  const canEdit = isAdmin || isOwnProfile
  const canChangeRole = isAdmin && !isOwnProfile

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get<UserProfile>(`/users/${userId}`)
        setProfile(data)
        setName(data.name)
        setPhoneNumber(data.phoneNumber || "")
        setRole(data.role)
        if (currentUser?.organisationId) {
          const org: any = await api.get(
            `/organisations/${currentUser.organisationId}`
          )
          if (org?.countryCode) setOrgCountry(org.countryCode)
        }
      } catch (err) {
        toast.error("Failed to load user")
        setError("Failed to load user")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = userEditSchema.safeParse({ name, phoneNumber, role })
    if (!result.success) {
      setErrors(fieldErrors<ProfileFormData>(result))
      return
    }
    setErrors({})
    setError(null)
    setSaving(true)

    try {
      await api.patch(`/users/${userId}`, {
        ...result.data,
        phoneNumber: result.data.phoneNumber || null,
        role: canChangeRole ? result.data.role : undefined,
      })
      router.push(`/users/${userId}`)
    } catch (err) {
      toast.error("Failed to update user")
      setError("Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">{error || "User not found"}</p>
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

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <UserIcon className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setErrors({ ...errors, name: undefined })
                    setName(e.target.value)
                  }}
                  placeholder="Your name"
                  className="pl-10"
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <PhoneIcon className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setErrors({ ...errors, phoneNumber: undefined })
                    setPhoneNumber(e.target.value)
                  }}
                  onBlur={(e) => {
                    const v = e.target.value
                    if (v) setPhoneNumber(prependCountryCode(v, orgCountry))
                  }}
                  placeholder={getDialCode(orgCountry) + " 9000000000"}
                  className="pl-10"
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            {canChangeRole ? (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={profile.role} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Contact admin to change role
                </p>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
