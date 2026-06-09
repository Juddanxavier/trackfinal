"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  LaptopIcon,
  SmartphoneIcon,
  MonitorIcon,
  GlobeIcon,
  Trash2Icon,
  LogOutIcon,
  Loader2,
} from "lucide-react"
import { AnimatedPage } from "@/components/animated-page"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Session {
  id: string
  userAgent?: string
  ipAddress?: string
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}

function getDeviceIcon(userAgent?: string) {
  if (!userAgent) return <GlobeIcon className="h-4 w-4" />
  const ua = userAgent.toLowerCase()
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone"))
    return <SmartphoneIcon className="h-4 w-4" />
  if (ua.includes("tablet") || ua.includes("ipad"))
    return <LaptopIcon className="h-4 w-4" />
  return <MonitorIcon className="h-4 w-4" />
}

function getBrowserInfo(userAgent?: string) {
  if (!userAgent) return "Unknown"
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
    return "Chrome"
  if (userAgent.includes("Firefox")) return "Firefox"
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    return "Safari"
  if (userAgent.includes("Edg")) return "Edge"
  return "Other"
}

function getOSInfo(userAgent?: string) {
  if (!userAgent) return "Unknown"
  if (userAgent.includes("Windows")) return "Windows"
  if (userAgent.includes("Mac")) return "macOS"
  if (userAgent.includes("Linux")) return "Linux"
  if (userAgent.includes("Android")) return "Android"
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS"
  return "Unknown"
}

export default function SessionsPage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean
    session: Session | null
  }>({ open: false, session: null })

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }
    fetchSessions()
  }, [authUser, router])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await api.get<Session[]>("/auth/sessions")
      setSessions(Array.isArray(res) ? res : [])
    } catch {
      toast.error("Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeSession = async () => {
    if (!revokeDialog.session) return
    setRevokingId(revokeDialog.session.id)
    try {
      await api.delete(`/auth/sessions/${revokeDialog.session.id}`)
      toast.success("Session revoked")
      setRevokeDialog({ open: false, session: null })
      fetchSessions()
    } catch {
      toast.error("Failed to revoke session")
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeAllOther = async () => {
    setRevokingAll(true)
    try {
      const res = await api.delete<{
        message: string
        sessionsRevoked: number
      }>("/auth/sessions")
      toast.success(res.message || "All other sessions revoked")
      fetchSessions()
    } catch {
      toast.error("Failed to revoke sessions")
    } finally {
      setRevokingAll(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <AnimatedPage className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your active sessions
          </p>
        </div>
        {sessions.length > 1 && (
          <Button
            variant="outline"
            onClick={handleRevokeAllOther}
            disabled={revokingAll}
          >
            {revokingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOutIcon className="mr-2 h-4 w-4" />
            )}
            {revokingAll ? "Revoking..." : "Revoke All Other"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MonitorIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No active sessions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={session.isCurrent ? "border-primary" : ""}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {getBrowserInfo(session.userAgent)} on{" "}
                        {getOSInfo(session.userAgent)}
                      </p>
                      {session.isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      IP: {session.ipAddress || "Unknown"} • Created{" "}
                      {formatDate(session.createdAt)}
                      {session.expiresAt &&
                        ` • Expires ${formatDate(session.expiresAt)}`}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() => setRevokeDialog({ open: true, session })}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={revokeDialog.open}
        onOpenChange={(open) =>
          setRevokeDialog({ open, session: revokeDialog.session })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this session? The device will be
              signed out immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialog({ open: false, session: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeSession}
              disabled={revokingId !== null}
            >
              {revokingId ? "Revoking..." : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
