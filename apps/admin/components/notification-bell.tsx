"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import {
  BellIcon,
  CheckIcon,
  PackageIcon,
  TruckIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  titleKey: string
  data: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

const notificationIcons: Record<string, React.ElementType> = {
}

const getMessage = (titleKey: string, data: Record<string, unknown>): string => {
  return titleKey
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    const token = sessionStorage.getItem('accessToken')
    if (!token) return

    try {
      const data = await api.get<Notification[]>("/notifications?limit=5")
      setNotifications(data)
    } catch (error: any) {
      if (error?.statusCode === 401) return
      console.error("Failed to fetch notifications:", error)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    const token = sessionStorage.getItem('accessToken')
    if (!token) return

    try {
      const count = await api.get<number>("/notifications/unread-count")
      setUnreadCount(count)
    } catch (error: any) {
      if (error?.statusCode === 401) return
      console.error("Failed to fetch unread count:", error)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()

    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount])

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error: any) {
      if (error?.statusCode === 401) return
      console.error("Failed to mark as read:", error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all")
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error: any) {
      if (error?.statusCode === 401) return
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      fetchNotifications()
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0 px-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.titleKey] || BellIcon
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start gap-1 px-2 py-2 cursor-pointer",
                    !notification.isRead && "bg-accent/50"
                  )}
                  onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <Icon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="text-sm">{getMessage(notification.titleKey, notification.data)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}