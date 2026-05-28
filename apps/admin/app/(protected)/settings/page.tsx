'use client'

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth-context"
import { TwoFactorSetup } from "@/components/two-factor-setup"
import { api, ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getDialCode, prependCountryCode, formatPhoneDisplay } from "@/lib/phone"
import { settingsOrgSchema, fieldErrors, type SettingsOrgFormData } from "@/lib/validation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Building2Icon,
  PaletteIcon,
  SaveIcon,
  Loader2Icon,
  BellIcon,
  MonitorIcon,
  ShieldIcon,
  WebhookIcon,
} from "lucide-react"
import { AnimatedPage } from "@/components/animated-page"

interface OrganisationData {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  countryCode: string | null
  currency: string | null
  logoUrl: string | null
  timezone: string | null
  dateFormat: string | null
  isActive: boolean
}

interface NotificationPrefs {
  emailEnabled: boolean
  whatsappEnabled: boolean
  inTransitNotifications: boolean
  deliveredNotifications: boolean
  exceptionsNotifications: boolean
}

export default function SettingsPage() {
  const { user, selectedOrganisation } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [org, setOrg] = useState<OrganisationData | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof SettingsOrgFormData, string>>>({})
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    emailEnabled: true,
    whatsappEnabled: true,
    inTransitNotifications: true,
    deliveredNotifications: true,
    exceptionsNotifications: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedOrganisation) {
        setFetching(false)
        return
      }

      try {
        const [orgData, prefsData] = await Promise.all([
          api.get<OrganisationData | null>(
            `/organisations/${selectedOrganisation}`,
            { throwOnError: false }
          ),
          api.get<NotificationPrefs>(
            `/notifications/preferences`,
            { throwOnError: false }
          ),
        ])
        if (orgData) setOrg(orgData)
        if (prefsData) setPrefs(prefsData)
      } catch (err) {
        console.error("Failed to fetch settings:", err)
      } finally {
        setFetching(false)
      }
    }

    fetchData()
  }, [selectedOrganisation])

  const handleSaveOrg = async () => {
    if (!selectedOrganisation || !org) return

    const result = settingsOrgSchema.safeParse(org)
    if (!result.success) {
      setErrors(fieldErrors<SettingsOrgFormData>(result))
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await api.patch(`/organisations/${selectedOrganisation}`, result.data)
      toast.success("Organisation settings saved")
    } catch (err) {
      console.error("Failed to save organisation:", err)
      toast.error("Failed to save organisation settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSavePrefs = async () => {
    setLoading(true)
    try {
      await api.patch(`/notifications/preferences`, prefs)
      toast.success("Notification preferences saved")
    } catch (err) {
      console.error("Failed to save notification prefs:", err)
      toast.error("Failed to save notification preferences")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-lg" />
      </div>
    )
  }

  return (
    <AnimatedPage className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organisation settings and preferences
        </p>
      </div>

      <Tabs defaultValue="organisation" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="organisation" className="gap-2">
            <Building2Icon className="h-4 w-4" />
            <span className="hidden sm:inline">Organisation</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <PaletteIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <BellIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organisation" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-lg font-semibold">Organisation Details</h3>
              <p className="text-sm text-muted-foreground">
                Basic information about your organisation
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organisation Name</Label>
                <Input
                  id="name"
                  value={org?.name || ""}
                  onChange={(e) => { setErrors({ ...errors, name: undefined }); setOrg(org ? { ...org, name: e.target.value } : null) }}
                  placeholder="Your organisation name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={org?.slug || ""}
                  disabled
                  placeholder="your-org"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={org?.email || ""}
                  onChange={(e) => { setErrors({ ...errors, email: undefined }); setOrg(org ? { ...org, email: e.target.value } : null) }}
                  placeholder="org@example.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={org?.phone || ""}
                  onChange={(e) => { setErrors({ ...errors, phone: undefined }); setOrg(org ? { ...org, phone: e.target.value } : null) }}
                  onBlur={(e) => {
                    const val = e.target.value
                    if (val && org) {
                      setOrg({ ...org, phone: prependCountryCode(val, org.countryCode || "IN") })
                    }
                  }}
                  placeholder={getDialCode(org?.countryCode || "IN") + " 9000000000"}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={org?.address || ""}
                  onChange={(e) => { setErrors({ ...errors, address: undefined }); setOrg(org ? { ...org, address: e.target.value } : null) }}
                  placeholder="123 Business St"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={org?.city || ""}
                  onChange={(e) => { setErrors({ ...errors, city: undefined }); setOrg(org ? { ...org, city: e.target.value } : null) }}
                  placeholder="City"
                />
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={org?.state || ""}
                  onChange={(e) => { setErrors({ ...errors, state: undefined }); setOrg(org ? { ...org, state: e.target.value } : null) }}
                  placeholder="State"
                />
                {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={org?.postalCode || ""}
                  onChange={(e) => { setErrors({ ...errors, postalCode: undefined }); setOrg(org ? { ...org, postalCode: e.target.value } : null) }}
                  placeholder="12345"
                />
                {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryCode">Country</Label>
                <Select
                  value={org?.countryCode || "IN"}
                  onValueChange={(value) => setOrg(org ? { ...org, countryCode: value } : null)}
                >
                  <SelectTrigger id="countryCode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">India</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={org?.currency || "INR"}
                  onValueChange={(value) => setOrg(org ? { ...org, currency: value } : null)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveOrg} disabled={loading || !org} className="gap-2">
                {loading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4" />
                )}
                {loading ? "Saving..." : "Save Organisation"}
              </Button>
            </div>
          </div>

          <Link href="/sessions">
            <Button variant="outline" className="w-full gap-2">
              <MonitorIcon className="h-4 w-4" />
              Manage Sessions
            </Button>
          </Link>
          <Link href="/settings/webhooks">
            <Button variant="outline" className="w-full gap-2">
              <WebhookIcon className="h-4 w-4" />
              Webhooks
            </Button>
          </Link>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-lg font-semibold">Appearance</h3>
              <p className="text-sm text-muted-foreground">
                Customise the look and feel
              </p>
            </div>
              <div className="flex items-center justify-between rounded-lg border p-4 mt-4">
                <div className="flex flex-col space-y-1">
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark theme
                  </p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => {
                    const newTheme = checked ? "dark" : "light"
                    setTheme(newTheme)
                  }}
                />
              </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {user && <TwoFactorSetup userId={user.id} />}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-lg font-semibold">Notification Channels</h3>
              <p className="text-sm text-muted-foreground">
                Configure how you receive notifications
              </p>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={prefs.emailEnabled}
                  onCheckedChange={(checked) =>
                    setPrefs({ ...prefs, emailEnabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications
                  </p>
                </div>
                <Switch
                  checked={prefs.whatsappEnabled}
                  onCheckedChange={(checked) =>
                    setPrefs({ ...prefs, whatsappEnabled: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-lg font-semibold">Status Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Choose which shipment status changes to be notified about
              </p>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>In Transit</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when shipment is in transit
                  </p>
                </div>
                <Switch
                  checked={prefs.inTransitNotifications}
                  onCheckedChange={(checked) =>
                    setPrefs({ ...prefs, inTransitNotifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Delivered</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when shipment is delivered
                  </p>
                </div>
                <Switch
                  checked={prefs.deliveredNotifications}
                  onCheckedChange={(checked) =>
                    setPrefs({ ...prefs, deliveredNotifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exceptions</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify on delivery exceptions
                  </p>
                </div>
                <Switch
                  checked={prefs.exceptionsNotifications}
                  onCheckedChange={(checked) =>
                    setPrefs({ ...prefs, exceptionsNotifications: checked })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSavePrefs} disabled={loading} className="gap-2">
                {loading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4" />
                )}
                {loading ? "Saving..." : "Save Notification Preferences"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AnimatedPage>
  )
}
