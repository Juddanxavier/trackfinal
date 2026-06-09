"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth-context"
import { TwoFactorSetup } from "@/components/two-factor-setup"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getDialCode, prependCountryCode } from "@/lib/phone"
import { settingsOrgSchema, type SettingsOrgFormData } from "@/lib/validation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    emailEnabled: true,
    whatsappEnabled: true,
    inTransitNotifications: true,
    deliveredNotifications: true,
    exceptionsNotifications: true,
  })

  const {
    register: orgRegister,
    handleSubmit: orgHandleSubmit,
    reset: orgReset,
    control: orgControl,
    formState: { errors: orgErrors, isSubmitting: orgIsSubmitting },
  } = useForm<SettingsOrgFormData>({
    resolver: zodResolver(settingsOrgSchema),
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
          api.get<NotificationPrefs>(`/notifications/preferences`, {
            throwOnError: false,
          }),
        ])
        if (orgData) {
          setOrg(orgData)
          orgReset({
            name: orgData.name || "",
            email: orgData.email || "",
            phone: orgData.phone || "",
            address: orgData.address || "",
            city: orgData.city || "",
            state: orgData.state || "",
            postalCode: orgData.postalCode || "",
            countryCode: orgData.countryCode || "IN",
            currency: orgData.currency || "INR",
          })
        }
        if (prefsData) setPrefs(prefsData)
      } catch (err) {
        toast.error("Failed to load settings")
      } finally {
        setFetching(false)
      }
    }

    fetchData()
  }, [selectedOrganisation])

  const onOrgSubmit = async (data: SettingsOrgFormData) => {
    if (!selectedOrganisation) return
    try {
      await api.patch(`/organisations/${selectedOrganisation}`, data)
      toast.success("Organisation settings saved")
    } catch (err) {
      toast.error("Failed to save organisation settings")
    }
  }

  const handleSavePrefs = async () => {
    setLoading(true)
    try {
      await api.patch(`/notifications/preferences`, prefs)
      toast.success("Notification preferences saved")
    } catch (err) {
      toast.error("Failed to save notification preferences")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-96 rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <AnimatedPage className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
            <form onSubmit={orgHandleSubmit(onOrgSubmit)}>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Organisation Name</Label>
                  <Input
                    id="name"
                    {...orgRegister("name")}
                    placeholder="Your organisation name"
                  />
                  {orgErrors.name && (
                    <p className="text-sm text-red-500">
                      {orgErrors.name.message}
                    </p>
                  )}
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
                    {...orgRegister("email")}
                    placeholder="org@example.com"
                  />
                  {orgErrors.email && (
                    <p className="text-sm text-red-500">
                      {orgErrors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...orgRegister("phone")}
                    placeholder={
                      getDialCode(org?.countryCode || "IN") + " 9000000000"
                    }
                  />
                  {orgErrors.phone && (
                    <p className="text-sm text-red-500">
                      {orgErrors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...orgRegister("address")}
                    placeholder="123 Business St"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...orgRegister("city")}
                    placeholder="City"
                  />
                  {orgErrors.city && (
                    <p className="text-sm text-red-500">
                      {orgErrors.city.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...orgRegister("state")}
                    placeholder="State"
                  />
                  {orgErrors.state && (
                    <p className="text-sm text-red-500">
                      {orgErrors.state.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    {...orgRegister("postalCode")}
                    placeholder="12345"
                  />
                  {orgErrors.postalCode && (
                    <p className="text-sm text-red-500">
                      {orgErrors.postalCode.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country</Label>
                  <Controller
                    name="countryCode"
                    control={orgControl}
                    render={({ field }) => (
                      <Select
                        value={field.value || "IN"}
                        onValueChange={field.onChange}
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
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Controller
                    name="currency"
                    control={orgControl}
                    render={({ field }) => (
                      <Select
                        value={field.value || "INR"}
                        onValueChange={field.onChange}
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
                    )}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit" className="gap-2">
                  {orgIsSubmitting ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon className="h-4 w-4" />
                  )}
                  {orgIsSubmitting ? "Saving..." : "Save Organisation"}
                </Button>
              </div>
            </form>
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
            <div className="mt-4 flex items-center justify-between rounded-lg border p-4">
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
            <div className="mt-4 space-y-4">
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
            <div className="mt-4 space-y-4">
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
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSavePrefs}
                disabled={loading}
                className="gap-2"
              >
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
