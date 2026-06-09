"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createWebhookSchema,
  type CreateWebhookFormData,
} from "@/lib/validation"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AnimatedPage } from "@/components/animated-page"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { toast } from "sonner"
import {
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  WebhookIcon,
  CopyIcon,
  ExternalLinkIcon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface WebhookEndpoint {
  id: string
  url: string
  secret: string
  events: string[]
  isActive: boolean
  lastTriggeredAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  failureCount: number
  createdAt: string
}

interface WebhookDeliveryLog {
  id: string
  event: string
  status: string
  statusCode: number | null
  attempt: number
  maxAttempts: number
  responseBody: string | null
  completedAt: string | null
  createdAt: string
}

const ALL_EVENTS = ["delivered", "in_transit", "exception", "cancelled"]
const EVENT_LABELS: Record<string, string> = {
  delivered: "Delivered",
  in_transit: "In Transit",
  exception: "Exception",
  cancelled: "Cancelled",
}

export default function WebhooksSettingsPage() {
  const { selectedOrganisation } = useAuth()
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const webhookForm = useForm<CreateWebhookFormData>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: { url: "", events: ["delivered"] },
  })
  const {
    register: whRegister,
    handleSubmit: whHandleSubmit,
    watch: whWatch,
    setValue: whSetValue,
    reset: whReset,
    formState: { errors: whErrors },
  } = webhookForm
  const whEvents = whWatch("events")
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const [logs, setLogs] = useState<WebhookDeliveryLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchEndpoints = async () => {
    if (!selectedOrganisation) return
    try {
      const data = await api.get<WebhookEndpoint[]>("/webhooks")
      setEndpoints(data)
    } catch {
      setEndpoints([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEndpoints()
  }, [selectedOrganisation])

  const toggleEvent = (event: string) => {
    const current = whWatch("events")
    const updated = current.includes(event)
      ? current.filter((e) => e !== event)
      : [...current, event]
    whSetValue("events", updated, { shouldValidate: true })
  }

  const onCreateSubmit = async (data: CreateWebhookFormData) => {
    try {
      await api.post("/webhooks", { url: data.url, events: data.events })
      toast.success("Webhook endpoint created")
      setShowForm(false)
      whReset({ url: "", events: ["delivered"] })
      await fetchEndpoints()
    } catch {
      toast.error("Failed to create webhook endpoint")
    }
  }

  const handleToggle = async (endpoint: WebhookEndpoint) => {
    try {
      await api.patch(`/webhooks/${endpoint.id}`, {
        isActive: !endpoint.isActive,
      })
      await fetchEndpoints()
    } catch {
      toast.error("Failed to update webhook endpoint")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/webhooks/${id}`)
      toast.success("Webhook endpoint deleted")
      if (selectedEndpoint === id) {
        setSelectedEndpoint(null)
        setLogs([])
      }
      await fetchEndpoints()
    } catch {
      toast.error("Failed to delete webhook endpoint")
    }
  }

  const viewLogs = async (id: string) => {
    setSelectedEndpoint(id)
    setLogsLoading(true)
    try {
      const data = await api.get<WebhookDeliveryLog[]>(
        `/webhooks/${id}/logs?limit=20`
      )
      setLogs(data)
    } catch {
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    toast.success("Secret copied to clipboard")
  }

  return (
    <AnimatedPage className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: "Settings", href: "/settings" },
              { label: "Webhooks" },
            ]}
          />
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-sm text-muted-foreground">
            Send real-time shipment events to external services
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Endpoint
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Webhook Endpoint</CardTitle>
            <CardDescription>
              We'll send a POST request with event data to this URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={whHandleSubmit(onCreateSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="url">Payload URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/webhooks/track"
                  {...whRegister("url")}
                />
                {whErrors.url && (
                  <p className="text-sm text-red-500">{whErrors.url.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Events to subscribe</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_EVENTS.map((event) => (
                    <Button
                      key={event}
                      type="button"
                      variant={
                        whEvents?.includes(event) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => toggleEvent(event)}
                    >
                      {EVENT_LABELS[event]}
                    </Button>
                  ))}
                </div>
                {whErrors.events && (
                  <p className="text-sm text-red-500">
                    {whErrors.events.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={
                  webhookForm.formState.isSubmitting || !whEvents?.length
                }
              >
                {webhookForm.formState.isSubmitting ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Endpoint
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : endpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WebhookIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No webhook endpoints configured
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {endpoints.map((ep) => (
            <Card key={ep.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-0.5 text-sm">
                        {ep.url}
                      </code>
                      <Switch
                        checked={ep.isActive}
                        onCheckedChange={() => handleToggle(ep)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ep.events.map((e) => (
                        <span
                          key={e}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                        >
                          {EVENT_LABELS[e] || e}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ep.failureCount > 0 && `${ep.failureCount} failures · `}
                      Created {new Date(ep.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copySecret(ep.secret)}
                      title="Copy secret"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => viewLogs(ep.id)}
                      title="View logs"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(ep.id)}
                      title="Delete"
                    >
                      <Trash2Icon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {selectedEndpoint === ep.id && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="mb-2 text-sm font-medium">Delivery Logs</h4>
                    {logsLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : logs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No delivery logs yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>HTTP</TableHead>
                            <TableHead>Attempt</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                {EVENT_LABELS[log.event] || log.event}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`text-xs ${log.status === "success" ? "text-green-600" : log.status === "failed" ? "text-red-600" : "text-yellow-600"}`}
                                >
                                  {log.status}
                                </span>
                              </TableCell>
                              <TableCell>{log.statusCode || "-"}</TableCell>
                              <TableCell>
                                {log.attempt}/{log.maxAttempts}
                              </TableCell>
                              <TableCell className="text-xs">
                                {new Date(log.createdAt).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AnimatedPage>
  )
}
