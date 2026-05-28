"use client"

import { FileText, Clock, DollarSign, CheckCircle2, XCircle } from "lucide-react"
import { StatsCard, StatsCardGrid } from "@/components/stats-card"

interface QuoteStatsCardsProps {
  total: number
  pending: number
  quoted: number
  accepted: number
  rejected: number
}

export function QuoteStatsCards(props: QuoteStatsCardsProps) {
  return (
    <StatsCardGrid columns={5}>
      <StatsCard
        title="Total"
        value={props.total}
        subtitle="All quotes"
        icon={<FileText className="h-4 w-4" />}
        color="blue"
      />
      <StatsCard
        title="Pending"
        value={props.pending}
        subtitle={
          props.total > 0
            ? `${Math.round((props.pending / props.total) * 100)}% of total`
            : "0% of total"
        }
        icon={<Clock className="h-4 w-4" />}
        color="amber"
      />
      <StatsCard
        title="Quoted"
        value={props.quoted}
        subtitle={
          props.total > 0
            ? `${Math.round((props.quoted / props.total) * 100)}% of total`
            : "0% of total"
        }
        icon={<DollarSign className="h-4 w-4" />}
        color="purple"
      />
      <StatsCard
        title="Accepted"
        value={props.accepted}
        subtitle={
          props.total > 0
            ? `${Math.round((props.accepted / props.total) * 100)}% success rate`
            : "0% success rate"
        }
        icon={<CheckCircle2 className="h-4 w-4" />}
        color="green"
      />
      <StatsCard
        title="Rejected"
        value={props.rejected}
        subtitle={
          props.total > 0
            ? `${Math.round((props.rejected / props.total) * 100)}% of total`
            : "0% of total"
        }
        icon={<XCircle className="h-4 w-4" />}
        color="red"
      />
    </StatsCardGrid>
  )
}
