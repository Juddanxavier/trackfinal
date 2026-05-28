"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BulkActionFooter } from "@/components/bulk-action-footer"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import { DataTable, RowCheckbox, SelectAllCheckbox, type ColumnDef, type SortingState } from "@/components/data-table"
import {
  BellIcon,
  BellOffIcon,
  CheckIcon,
  MailIcon,
} from "lucide-react"

interface Notification {
  id: string
  userId: string
  organisationId: string
  type: string
  title: string
  message: string
  isRead: boolean
  data?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface Stats {
  total: number
  unread: number
  read: number
  count?: number
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all")
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", limit.toString())
      if (filter === "read") params.set("isRead", "true")
      if (filter === "unread") params.set("isRead", "false")
      if (sorting.length > 0) {
        params.set("sortBy", sorting[0].id)
        params.set("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const res = await api.get<{
        data: Notification[]
        total: number
        page: number
        limit: number
        totalPages: number
      }>(`/notifications?${params}`, { throwOnError: false })

      if (res && res.data) {
        setNotifications(res.data)
        setTotal(res.total ?? 0)
        setTotalPages(res.totalPages ?? 0)
      } else {
        setNotifications([])
        setTotal(0)
        setTotalPages(0)
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get<Stats>("/notifications/unread-count", { throwOnError: false })
      if (res) {
        const unread = res.unread || res.count || 0
        setStats({
          total: res.total || 0,
          unread,
          read: res.read || (res.total ? res.total - unread : 0),
        })
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    setPage(1)
    fetchNotifications()
  }, [filter])

  useEffect(() => {
    fetchNotifications()
  }, [page, limit, sorting])

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      fetchStats()
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const markAsUnread = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/unread`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      )
      fetchStats()
    } catch (err) {
      console.error("Failed to mark as unread:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all")
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
      fetchStats()
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "email":
        return <MailIcon className="h-4 w-4" />
      default:
        return <BellIcon className="h-4 w-4" />
    }
  }

  const columns: ColumnDef<Notification>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <SelectAllCheckbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
        />
      ),
      cell: ({ row }) => (
        <RowCheckbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
        />
      ),
      enableSorting: false,
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => getNotificationIcon(row.original.type),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className={row.original.isRead ? "opacity-60" : ""}>
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <span className={`max-w-xs truncate block ${row.original.isRead ? "opacity-60" : ""}`}>
          {row.original.message}
        </span>
      ),
    },
    {
      accessorKey: "isRead",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isRead ? "secondary" : "default"}>
          {row.original.isRead ? "Read" : "Unread"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const notification = row.original
        return notification.isRead ? (
          <Button variant="ghost" size="sm" onClick={() => markAsUnread(notification.id)}>
            Mark Unread
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
            Mark Read
          </Button>
        )
      },
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your notifications
          </p>
        </div>
        {stats && stats.unread > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckIcon className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BellIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="border rounded-lg bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BellIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="text-2xl font-bold">{stats?.unread || 0}</p>
            </div>
          </div>
        </div>
        <div className="border rounded-lg bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BellOffIcon className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Read</p>
              <p className="text-2xl font-bold">{stats?.read || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          Unread
        </Button>
        <Button
          variant={filter === "read" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("read")}
        >
          Read
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={notifications}
        loading={loading}
        getRowId={(row) => row.id}
        emptyState={
          <Empty>
            <EmptyDescription>No notifications found</EmptyDescription>
          </Empty>
        }
        enableRowSelection
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        manualPagination
        page={page}
        pageSize={limit}
        total={total}
        pageCount={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
        pageSizeOptions={[10, 20, 50, 100]}
        customFooter={<BulkActionFooter
          selectedCount={selectedIds.length}
          actions={[
            { label: "Mark Read", variant: "outline", onClick: () => {
              selectedIds.forEach(id => markAsRead(id))
              setSelectedIds([])
            }},
            { label: "Mark Unread", variant: "outline", onClick: () => {
              selectedIds.forEach(id => markAsUnread(id))
              setSelectedIds([])
            }},
          ]}
        />}
      />
    </div>
  )
}
