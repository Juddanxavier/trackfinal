"use client"

import { motion } from "framer-motion"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatsCardColor =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "teal"
  | "amber"
  | "red"
  | "emerald"
  | "indigo"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: StatsCardColor
  trend?: number
  trendLabel?: string
  variant?: "default" | "inline" | "minimal" | "gradient"
  animated?: boolean
  delay?: number
  className?: string
}

const colorStyles: Record<StatsCardColor, { icon: string; badge: string }> = {
  blue: {
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    badge: "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  },
  green: {
    icon: "bg-green-500/10 text-green-600 dark:text-green-400",
    badge:
      "bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    badge:
      "bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
  },
  orange: {
    icon: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    badge:
      "bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
  },
  teal: {
    icon: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    badge: "bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    badge:
      "bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
  },
  red: {
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
    badge: "bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
  },
  indigo: {
    icon: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    badge:
      "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300",
  },
}

const accentBar: Record<StatsCardColor, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
  orange: "bg-orange-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  emerald: "bg-emerald-500",
  indigo: "bg-indigo-500",
}

const accentBg: Record<StatsCardColor, string> = {
  blue: "bg-blue-500/[0.03] dark:bg-blue-400/[0.05]",
  green: "bg-emerald-500/[0.03] dark:bg-emerald-400/[0.05]",
  purple: "bg-violet-500/[0.03] dark:bg-violet-400/[0.05]",
  orange: "bg-orange-500/[0.03] dark:bg-orange-400/[0.05]",
  teal: "bg-teal-500/[0.03] dark:bg-teal-400/[0.05]",
  amber: "bg-amber-500/[0.03] dark:bg-amber-400/[0.05]",
  red: "bg-rose-500/[0.03] dark:bg-rose-400/[0.05]",
  emerald: "bg-emerald-500/[0.03] dark:bg-emerald-400/[0.05]",
  indigo: "bg-indigo-500/[0.03] dark:bg-indigo-400/[0.05]",
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  trend,
  trendLabel,
  variant = "default",
  animated = false,
  delay = 0,
  className,
}: StatsCardProps) {
  const styles = colorStyles[color]

  const card = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-200",
        "hover:shadow-md",
        variant === "inline" && "hover:border-gray-300",
        className
      )}
    >
      {variant === "gradient" ? (
        <>
          <div className={cn("-mx-4 -mt-4 mb-0 rounded-t-xl border-b border-border/50 px-4 pt-4 pb-3", accentBg[color])}>
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {title}
              </p>
              {icon && (
                <div className={cn("shrink-0 rounded-md p-1.5", styles.icon)}>
                  {icon}
                </div>
              )}
            </div>
          </div>
          <div className="pt-2">
            <p className="text-2xl font-bold">{value}</p>
            <div className="mt-1 flex items-center gap-2">
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend !== undefined && (
                <Badge
                  className={cn(
                    "flex items-center gap-1 border-0 px-2 py-0.5 text-xs font-medium",
                    styles.badge
                  )}
                >
                  {trend >= 0 ? (
                    <TrendingUpIcon className="size-3" />
                  ) : (
                    <TrendingDownIcon className="size-3" />
                  )}
                  {Math.abs(trend)}%
                </Badge>
              )}
            </div>
          </div>
        </>
      ) : variant === "inline" ? (
        <>
          <div className="flex items-center gap-4">
            {icon && (
              <div className={cn("shrink-0 rounded-lg p-2.5", styles.icon)}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{value}</p>
                {trend !== undefined && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      trend >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {trend >= 0 ? (
                      <TrendingUpIcon className="size-3" />
                    ) : (
                      <TrendingDownIcon className="size-3" />
                    )}
                    {Math.abs(trend)}%
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </>
      ) : variant === "minimal" ? (
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {title}
            </p>
            {icon && (
              <div className={cn("shrink-0 rounded-md p-1.5", styles.icon)}>
                {icon}
              </div>
            )}
          </div>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <div className="mt-1 flex items-center gap-2">
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend !== undefined && (
              <Badge
                className={cn(
                  "flex items-center gap-1 border-0 px-2 py-0.5 text-xs font-medium",
                  styles.badge
                )}
              >
                {trend >= 0 ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {Math.abs(trend)}%
              </Badge>
            )}
          </div>
        </>
      )}
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay,
          ease: "easeOut",
        }}
      >
        {card}
      </motion.div>
    )
  }

  return card
}

export function StatsCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
  }

  return (
    <div className={cn("grid grid-cols-2 gap-6", gridCols[columns], className)}>
      {children}
    </div>
  )
}
