'use client'

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth-context"
import { api, ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
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
  BellIcon,
  GlobeIcon,
  SaveIcon,
  Loader2Icon,
} from "lucide-react"

interface OrganisationSettings {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  countryCode: string
  currency: string
  logoUrl: string
  timezone: string
  dateFormat: string
  emailNotifications: boolean
  pushNotifications: boolean
  theme: string
}

const DEFAULT_SETTINGS: OrganisationSettings = {
  id: "",
  name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "US",
  currency: "USD",
  logoUrl: "",
  timezone: "America/New_York",
  dateFormat: "MM/DD/YYYY",
  emailNotifications: true,
  pushNotifications: true,
  theme: "system",
}

export default function SettingsPage() {
  const { selectedOrganisation } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [settings, setSettings] = useState<OrganisationSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const fetchSettings = async () => {
      if (!selectedOrganisation) {
        setFetching(false)
        return
      }

      try {
        const res = await api.get<OrganisationSettings>(
          `/settings?organisationId=${selectedOrganisation}`,
          { throwOnError: false }
        )
        if (res) {
          setSettings(res)
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err)
      } finally {
        setFetching(false)
      }
    }

    fetchSettings()
  }, [selectedOrganisation])

  const handleSave = async () => {
    if (!selectedOrganisation) {
      toast.error("No organisation selected")
      return
    }

    setLoading(true)
    try {
      await api.put(`/settings/${settings.id || selectedOrganisation}`, {
        ...settings,
      })
      toast.success("Settings saved successfully")
    } catch (err) {
      console.error("Failed to save settings:", err)
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error("Failed to save settings")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    setTheme(newTheme)
    setSettings({ ...settings, theme: newTheme })
  }

  if (fetching) {
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your organisation settings and preferences
            </p>
          </div>

          <div className="px-4 lg:px-6">
            <Tabs defaultValue="organisation" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="organisation" className="gap-2">
                  <Building2Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">Organisation</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="gap-2">
                  <PaletteIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Appearance</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2">
                  <GlobeIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Preferences</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <BellIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="organisation" className="space-y-6">
                <div className="rounded-lg border bg-card">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-semibold leading-none tracking-tight">
                      Organisation Details
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Basic information about your organisation
                    </p>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Organisation Name</Label>
                        <Input
                          id="name"
                          value={settings.name}
                          onChange={(e) =>
                            setSettings({ ...settings, name: e.target.value })
                          }
                          placeholder="Your organisation name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          value={settings.slug}
                          onChange={(e) =>
                            setSettings({ ...settings, slug: e.target.value })
                          }
                          placeholder="your-org-slug"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={settings.email}
                          onChange={(e) =>
                            setSettings({ ...settings, email: e.target.value })
                          }
                          placeholder="org@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={settings.phone}
                          onChange={(e) =>
                            setSettings({ ...settings, phone: e.target.value })
                          }
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
<div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={settings.address}
                          onChange={(e) =>
                            setSettings({ ...settings, address: e.target.value })
                          }
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={settings.city}
                            onChange={(e) =>
                              setSettings({ ...settings, city: e.target.value })
                            }
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={settings.state}
                            onChange={(e) =>
                              setSettings({ ...settings, state: e.target.value })
                            }
                            placeholder="State"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={settings.postalCode}
                            onChange={(e) =>
                              setSettings({ ...settings, postalCode: e.target.value })
                            }
                            placeholder="12345"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="countryCode">Country</Label>
                          <Select
                            value={settings.countryCode}
                            onValueChange={(v) =>
                              setSettings({ ...settings, countryCode: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                            value={settings.currency}
                            onValueChange={(v) =>
                              setSettings({ ...settings, currency: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <div className="rounded-lg border bg-card">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-semibold leading-none tracking-tight">
                      Appearance
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Customise how the application looks
                    </p>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex flex-col space-y-1">
                        <Label className="text-base">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Toggle between light and dark theme
                        </p>
                      </div>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={handleThemeChange}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <div className="rounded-lg border bg-card">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-semibold leading-none tracking-tight">
                      Preferences
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Customise your experience
                    </p>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={settings.timezone}
                          onValueChange={(value) =>
                            setSettings({ ...settings, timezone: value })
                          }
                        >
                          <SelectTrigger id="timezone">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">
                              Eastern Time (ET)
                            </SelectItem>
                            <SelectItem value="America/Chicago">
                              Central Time (CT)
                            </SelectItem>
                            <SelectItem value="America/Denver">
                              Mountain Time (MT)
                            </SelectItem>
                            <SelectItem value="America/Los_Angeles">
                              Pacific Time (PT)
                            </SelectItem>
                            <SelectItem value="Europe/London">
                              GMT/BST
                            </SelectItem>
                            <SelectItem value="Europe/Paris">
                              Central European Time
                            </SelectItem>
                            <SelectItem value="Asia/Tokyo">
                              Japan Standard Time
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <Select
                          value={settings.dateFormat}
                          onValueChange={(value) =>
                            setSettings({ ...settings, dateFormat: value })
                          }
                        >
                          <SelectTrigger id="dateFormat">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">
                              MM/DD/YYYY
                            </SelectItem>
                            <SelectItem value="DD/MM/YYYY">
                              DD/MM/YYYY
                            </SelectItem>
                            <SelectItem value="YYYY-MM-DD">
                              YYYY-MM-DD
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={settings.currency}
                          onValueChange={(value) =>
                            setSettings({ ...settings, currency: value })
                          }
                        >
                          <SelectTrigger id="currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="CNY">CNY (¥)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <div className="rounded-lg border bg-card">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-semibold leading-none tracking-tight">
                      Notifications
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure how you receive notifications
                    </p>
                  </div>
                  <div className="p-6 pt-0 space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex flex-col space-y-1">
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates via email
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            emailNotifications: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex flex-col space-y-1">
                        <Label className="text-base">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates in your browser
                        </p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            pushNotifications: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-6">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                {loading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4" />
                )}
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}