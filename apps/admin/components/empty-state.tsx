"use client"

import Link from "next/link"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import {
  PackageSearchIcon,
  InboxIcon,
  UserPlusIcon,
  FileSearchIcon,
  SearchXIcon,
  BarChart3Icon,
  BellIcon,
} from "lucide-react"

const entityConfig = {
  shipments: {
    icon: PackageSearchIcon,
    title: "No shipments yet",
    description: "Shipments appear here once created.",
  },
  quotes: {
    icon: FileSearchIcon,
    title: "No quotes yet",
    description: "Quotes appear here once customers request them.",
  },
  users: {
    icon: UserPlusIcon,
    title: "No users found",
    description: "Invite users to collaborate on your logistics operations.",
  },
  invitations: {
    icon: InboxIcon,
    title: "No invitations sent",
    description: "Sent invitations will appear here.",
  },
  notifications: {
    icon: BellIcon,
    title: "No notifications",
    description:
      "Notifications will appear here when something needs your attention.",
  },
  organisations: {
    icon: BarChart3Icon,
    title: "No organisations",
    description: "Organisations you manage will appear here.",
  },
  generic: {
    icon: SearchXIcon,
    title: "Nothing here yet",
    description: "Data will appear here once available.",
  },
} as const

type Entity = keyof typeof entityConfig

interface EmptyStateProps {
  entity?: Entity
  title?: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({
  entity = "generic",
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = entityConfig[entity].icon
  const copy = entityConfig[entity]

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-4" />
        </EmptyMedia>
        <EmptyTitle>{title || copy.title}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <EmptyDescription>{description || copy.description}</EmptyDescription>
      </EmptyContent>
      {action && (
        <Button
          variant="outline"
          size="sm"
          {...(action.href
            ? {
                asChild: true,
                children: <Link href={action.href}>{action.label}</Link>,
              }
            : { onClick: action.onClick, children: action.label })}
        />
      )}
    </Empty>
  )
}
