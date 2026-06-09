"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { getDialCode, prependCountryCode } from "@/lib/phone"
import { profileSchema, type ProfileFormData } from "@/lib/validation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2Icon, SaveIcon, ArrowLeftIcon } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import Link from "next/link"
import { toast } from "sonner"
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes"

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
  const [orgCountry, setOrgCountry] = useState("IN")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useUnsavedChanges(isDirty)

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }

    const fetchProfile = async () => {
      try {
        const userRes = await api.get<UserProfile>("/users/me")
        reset({
          name: userRes.name || "",
          phoneNumber: userRes.phoneNumber || "",
        })
        if (authUser.organisationId) {
          const org: any = await api.get(
            `/organisations/${authUser.organisationId}`
          )
          if (org?.countryCode) setOrgCountry(org.countryCode)
        }
      } catch (error) {
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [authUser, router, reset])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await api.patch<UserProfile>("/auth/profile", data)
      await refreshUser()
      router.push("/profile")
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile")
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl animate-pulse space-y-4">
          <div className="h-48 rounded-lg bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <Breadcrumbs
          items={[{ label: "Profile", href: "/profile" }, { label: "Edit" }]}
        />
        <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Your full name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
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
                {...register("phoneNumber")}
                onBlur={(e) => {
                  const v = e.target.value
                  if (v)
                    setValue("phoneNumber", prependCountryCode(v, orgCountry))
                }}
                placeholder={getDialCode(orgCountry) + " 9000000000"}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Link href="/profile">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
