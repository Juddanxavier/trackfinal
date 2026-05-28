import { Injectable } from '@nestjs/common';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { quotes } from '../../database/schema/quotes';
import { users } from '../../database/schema/user';
import { organisations } from '../../database/schema/organisations';
import { branches } from '../../database/schema/branches';
import { carriers } from '../../database/schema/carriers';
import { eq, and, gte, lte, sql, isNull, count, inArray, SQL } from 'drizzle-orm';

type ShipmentStatus =
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'archived';
type QuoteStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'deleted';

export interface ReportStats {
  shipments: {
    total: number;
    pending: number;
    in_transit: number;
    delivered: number;
    cancelled: number;
    deliveryRate: number;
    avgTransitDays: number;
  };
  quotes: {
    total: number;
    converted: number;
    conversionRate: number;
    avgValue: number;
  };
  invoices: {
    totalRevenue: number;
    avgInvoiceAmount: number;
    invoiceCount: number;
  };
}

export interface ChartDataPoint {
  date: string;
  shipments: number;
  quotes: number;
  delivered: number;
  revenue: number;
}

export interface RouteData {
  origin: string;
  destination: string;
  count: number;
}

export interface CarrierData {
  carrier: string;
  total: number;
  delivered: number;
  deliveryRate: number;
  avgDays: number;
}

export interface CarrierTrend {
  month: string;
  total: number;
  delivered: number;
  deliveryRate: number;
}

export interface CarrierAnalytic {
  carrier: string;
  total: number;
  delivered: number;
  exceptionCount: number;
  deliveryRate: number;
  exceptionRate: number;
  onTimeRate: number;
  avgDays: number;
  p50: number;
  p90: number;
  trend: CarrierTrend[];
}

export interface CarrierAnalyticsResult {
  carriers: CarrierAnalytic[];
  summary: {
    bestPerformer: string;
    worstPerformer: string;
    overallOnTimeRate: number;
    avgTransitDays: number;
  };
}

export interface CustomerRetention {
  newCustomers: number;
  returningCustomers: number;
  repeatRate: number;
  quoteToShipmentRate: number;
}

interface ShipmentRecord {
  id: string;
  status: string;
  deliveredAt: Date | null;
  createdAt: Date;
  trackingNumber: string;
  carrierCode: string;
  notifyEmail: string | null;
  billAmount: string | null;
}

interface QuoteRecord {
  id: string;
  status: QuoteStatus;
  price: string | null;
  deletedAt: Date | null;
  userId: string;
}

@Injectable()
export class ReportsService {
  async getReportSummary(options: {
    organisationId?: string;
    branchId?: string;
    range: string;
  }) {
    const { organisationId, branchId, range } = options;
    const dateRange = this.getDateRange(range);

    const shipmentConditions: SQL[] = [];
    if (organisationId) {
      shipmentConditions.push(eq(shipments.organisationId, organisationId));
    }
    if (branchId) {
      shipmentConditions.push(eq(shipments.branchId, branchId));
    }
    shipmentConditions.push(gte(shipments.createdAt, dateRange.start));
    shipmentConditions.push(lte(shipments.createdAt, dateRange.end));

    const quoteConditions: SQL[] = [isNull(quotes.deletedAt)];
    if (organisationId) {
      quoteConditions.push(eq(quotes.organisationId, organisationId));
    }
    quoteConditions.push(gte(quotes.createdAt, dateRange.start));
    quoteConditions.push(lte(quotes.createdAt, dateRange.end));

    const [allShipments, allQuotes, chartData, routes, carriers, retention] =
      await Promise.all([
        db
          .select()
          .from(shipments)
          .where(
            shipmentConditions.length > 0
              ? and(...shipmentConditions)
              : undefined,
          ) as Promise<ShipmentRecord[]>,
        db
          .select()
          .from(quotes)
          .where(
            quoteConditions.length > 0 ? and(...quoteConditions) : undefined,
          ) as Promise<QuoteRecord[]>,
        this.getChartData(organisationId, branchId, dateRange),
        this.getRouteData(organisationId, branchId, dateRange),
        this.getCarrierData(organisationId, branchId, dateRange),
        this.getRetentionData(organisationId, dateRange),
      ]);

    const stats = this.calculateStats(allShipments, allQuotes);

    return {
      stats,
      chartData,
      routes,
      carriers,
      retention,
    };
  }

  private getDateRange(range: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return { start, end };
  }

  private async getChartData(
    organisationId: string | undefined,
    branchId: string | undefined,
    dateRange: { start: Date; end: Date },
  ): Promise<ChartDataPoint[]> {
    const days: ChartDataPoint[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      const dayStart = new Date(current);
      const dayEnd = new Date(current.getTime() + dayMs - 1);

      const conditions: SQL[] = [
        gte(shipments.createdAt, dayStart),
        lte(shipments.createdAt, dayEnd),
      ];
      if (organisationId) {
        conditions.push(eq(shipments.organisationId, organisationId));
      }
      if (branchId) {
        conditions.push(eq(shipments.branchId, branchId));
      }

      const quoteConditions: SQL[] = [
        gte(quotes.createdAt, dayStart),
        lte(quotes.createdAt, dayEnd),
        isNull(quotes.deletedAt),
      ];
      if (organisationId) {
        quoteConditions.push(eq(quotes.organisationId, organisationId));
      }

      const [dayShipments, dayQuotes, dayDelivered, dayRevenue] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(shipments)
            .where(and(...conditions)),
          db
            .select({ count: count() })
            .from(quotes)
            .where(and(...quoteConditions)),
          db
            .select({ count: count() })
            .from(shipments)
            .where(and(...conditions, eq(shipments.status, 'delivered'))),
          db
            .select({
              revenue: sql<string>`coalesce(sum(${shipments.billAmount}::numeric), 0)`,
            })
            .from(shipments)
            .where(
              and(
                ...conditions,
                sql`${shipments.billAmount} IS NOT NULL`,
              ),
            ),
        ]);

      days.push({
        date: current.toISOString().split('T')[0],
        shipments: Number(dayShipments[0]?.count ?? 0),
        quotes: Number(dayQuotes[0]?.count ?? 0),
        delivered: Number(dayDelivered[0]?.count ?? 0),
        revenue: Number(dayRevenue[0]?.revenue ?? 0),
      });

      current.setTime(current.getTime() + dayMs);
    }

    return days;
  }

  private async getRouteData(
    organisationId: string | undefined,
    branchId: string | undefined,
    dateRange: { start: Date; end: Date },
  ): Promise<RouteData[]> {
    const conditions: SQL[] = [
      gte(shipments.createdAt, dateRange.start),
      lte(shipments.createdAt, dateRange.end),
    ];
    if (organisationId) {
      conditions.push(eq(shipments.organisationId, organisationId));
    }
    if (branchId) {
      conditions.push(eq(shipments.branchId, branchId));
    }

    const result = await db
      .select({
        originCountry: shipments.originCountry,
        destinationCountry: shipments.destinationCountry,
        count: sql<number>`count(*)`,
      })
      .from(shipments)
      .where(and(...conditions))
      .groupBy(shipments.originCountry, shipments.destinationCountry)
      .orderBy(sql`count(*) desc`)
      .limit(20);

    return result.map((r) => ({
      origin: r.originCountry || '',
      destination: r.destinationCountry || '',
      count: Number(r.count),
    }));
  }

  private async getCarrierData(
    organisationId: string | undefined,
    branchId: string | undefined,
    dateRange: { start: Date; end: Date },
  ): Promise<CarrierData[]> {
    const conditions: SQL[] = [
      gte(shipments.createdAt, dateRange.start),
      lte(shipments.createdAt, dateRange.end),
    ];
    if (organisationId) {
      conditions.push(eq(shipments.organisationId, organisationId));
    }
    if (branchId) {
      conditions.push(eq(shipments.branchId, branchId));
    }

    const result = await db
      .select({
        carrierCode: shipments.carrierCode,
        total: sql<number>`count(*)`,
        delivered: sql<number>`sum(case when status = 'delivered' then 1 else 0 end)`,
        totalDays: sql<number>`sum(extract(epoch from (coalesce(delivered_at, now()) - created_at))) / 86400`,
      })
      .from(shipments)
      .where(and(...conditions))
      .groupBy(shipments.carrierCode)
      .orderBy(sql`count(*) desc`);

    const codes = result.map((r) => r.carrierCode);
    const carrierMap = new Map<string, string>();
    if (codes.length > 0) {
      const rows = await db
        .select({ key: carriers.key, name: carriers.nameEn })
        .from(carriers)
        .where(inArray(carriers.key, codes));
      for (const row of rows) {
        carrierMap.set(row.key, row.name);
      }
    }

    return result.map((r) => {
      const total = Number(r.total) || 0;
      const delivered = Number(r.delivered) || 0;
      const avgDays = total > 0 ? Number(r.totalDays) / total : 0;

      return {
        carrier: carrierMap.get(r.carrierCode) || r.carrierCode,
        total,
        delivered,
        deliveryRate: total > 0 ? delivered / total : 0,
        avgDays,
      };
    });
  }

  private async getRetentionData(
    organisationId: string | undefined,
    dateRange: { start: Date; end: Date },
  ): Promise<CustomerRetention> {
    const userConditions: SQL[] = [];
    if (organisationId) {
      userConditions.push(eq(users.organisationId, organisationId));
    }
    userConditions.push(gte(users.createdAt, dateRange.start));
    userConditions.push(lte(users.createdAt, dateRange.end));

    const allUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(userConditions.length > 0 ? and(...userConditions) : undefined);

    const userIds = allUsers.map((u) => u.id);

    if (userIds.length === 0) {
      return {
        newCustomers: 0,
        returningCustomers: 0,
        repeatRate: 0,
        quoteToShipmentRate: 0,
      };
    }

    const shipmentConditions: SQL[] = [
      gte(shipments.createdAt, dateRange.start),
      lte(shipments.createdAt, dateRange.end),
    ];
    if (organisationId) {
      shipmentConditions.push(eq(shipments.organisationId, organisationId));
    }

    const allShipments = await db
      .select({ userId: shipments.userId })
      .from(shipments)
      .where(and(...shipmentConditions));

    const quoteConditions: SQL[] = [
      gte(quotes.createdAt, dateRange.start),
      lte(quotes.createdAt, dateRange.end),
      isNull(quotes.deletedAt),
    ];
    if (organisationId) {
      quoteConditions.push(eq(quotes.organisationId, organisationId));
    }

    const allQuotes = await db
      .select({ userId: quotes.userId })
      .from(quotes)
      .where(and(...quoteConditions));

    const customersWithShipments = new Set(allShipments.map((s) => s.userId));
    const customersWithQuotes = new Set(allQuotes.map((q) => q.userId));

    const newCustomers = userIds.length;
    const returningCustomers = userIds.filter(
      (id) => customersWithShipments.has(id) || customersWithQuotes.has(id),
    ).length;

    const shipmentsFromQuotes = allQuotes.filter((q) =>
      customersWithShipments.has(q.userId),
    ).length;

    return {
      newCustomers,
      returningCustomers,
      repeatRate: newCustomers > 0 ? returningCustomers / newCustomers : 0,
      quoteToShipmentRate:
        allQuotes.length > 0 ? shipmentsFromQuotes / allQuotes.length : 0,
    };
  }

  async getEntityInfo(
    organisationId?: string,
    branchId?: string,
  ): Promise<{
    organisation?: Record<string, unknown>;
    branch?: Record<string, unknown>;
  }> {
    let org: Record<string, unknown> | undefined;
    let branch: Record<string, unknown> | undefined;

    if (branchId) {
      const [row] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId));
      if (row) {
        branch = {
          id: row.id,
          name: row.name,
          email: row.email || undefined,
          phone: row.phone || undefined,
          address: row.address || undefined,
          city: row.city || undefined,
          state: row.state || undefined,
          postalCode: row.postalCode || undefined,
        };
        org = {
          id: row.organisationId,
          name: '',
        };
      }
    }

    if (organisationId && !org) {
      const [row] = await db
        .select()
        .from(organisations)
        .where(eq(organisations.id, organisationId));
      if (row) {
        org = {
          id: row.id,
          name: row.name,
          email: row.email || undefined,
          phone: row.phone || undefined,
          address: row.address || undefined,
          city: row.city || undefined,
          state: row.state || undefined,
          postalCode: row.postalCode || undefined,
          countryCode: row.countryCode || undefined,
        };
      }
    }

    return { organisation: org, branch };
  }

  async getCarrierAnalytics(
    options: {
      organisationId?: string;
      branchId?: string;
      range: string;
      slaDays?: number;
    },
  ): Promise<CarrierAnalyticsResult> {
    const { organisationId, branchId, range, slaDays = 7 } = options;
    const dateRange = this.getDateRange(range);

    const conditions: SQL[] = [
      gte(shipments.createdAt, dateRange.start),
      lte(shipments.createdAt, dateRange.end),
    ];
    if (organisationId) {
      conditions.push(eq(shipments.organisationId, organisationId));
    }
    if (branchId) {
      conditions.push(eq(shipments.branchId, branchId));
    }

    const allShipments = await db
      .select({
        id: shipments.id,
        status: shipments.status,
        carrierCode: shipments.carrierCode,
        createdAt: shipments.createdAt,
        deliveredAt: shipments.deliveredAt,
      })
      .from(shipments)
      .where(and(...conditions));

    const carrierGroups = new Map<string, typeof allShipments>();
    for (const s of allShipments) {
      const code = s.carrierCode || 'unknown';
      if (!carrierGroups.has(code)) carrierGroups.set(code, []);
      carrierGroups.get(code)!.push(s);
    }

    const codes = Array.from(carrierGroups.keys());
    const carrierMap = new Map<string, string>();
    if (codes.length > 0) {
      const rows = await db
        .select({ key: carriers.key, name: carriers.nameEn })
        .from(carriers)
        .where(inArray(carriers.key, codes));
      for (const row of rows) {
        carrierMap.set(row.key, row.name);
      }
    }

    const carriersResult: CarrierAnalytic[] = [];
    for (const [code, group] of carrierGroups) {
      const total = group.length;
      const delivered = group.filter((s) => s.status === 'delivered').length;
      const exceptionCount = group.filter((s) => s.status === 'exception').length;
      const deliveryRate = total > 0 ? delivered / total : 0;
      const exceptionRate = total > 0 ? exceptionCount / total : 0;

      const transitDays: number[] = [];
      for (const s of group) {
        if (s.deliveredAt && s.createdAt) {
          transitDays.push(
            (s.deliveredAt.getTime() - s.createdAt.getTime()) /
              (1000 * 60 * 60 * 24),
          );
        }
      }
      transitDays.sort((a, b) => a - b);
      const avgDays =
        transitDays.length > 0
          ? transitDays.reduce((a, b) => a + b, 0) / transitDays.length
          : 0;
      const p50 = transitDays.length > 0
        ? transitDays[Math.floor(transitDays.length * 0.5)]
        : 0;
      const p90 = transitDays.length > 0
        ? transitDays[Math.floor(transitDays.length * 0.9)]
        : 0;

      const onTime = group.filter((s) => {
        if (s.status !== 'delivered' || !s.deliveredAt || !s.createdAt) return false;
        const days =
          (s.deliveredAt.getTime() - s.createdAt.getTime()) /
          (1000 * 60 * 60 * 24);
        return days <= slaDays;
      }).length;
      const onTimeRate = delivered > 0 ? onTime / delivered : 0;

      const monthBuckets = new Map<string, { total: number; delivered: number }>();
      for (const s of group) {
        const key = s.createdAt.toISOString().slice(0, 7);
        if (!monthBuckets.has(key)) monthBuckets.set(key, { total: 0, delivered: 0 });
        const b = monthBuckets.get(key)!;
        b.total++;
        if (s.status === 'delivered') b.delivered++;
      }
      const trend: CarrierTrend[] = Array.from(monthBuckets.entries())
        .map(([month, b]) => ({
          month,
          total: b.total,
          delivered: b.delivered,
          deliveryRate: b.total > 0 ? b.delivered / b.total : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      carriersResult.push({
        carrier: carrierMap.get(code) || code,
        total,
        delivered,
        exceptionCount,
        deliveryRate,
        exceptionRate,
        onTimeRate,
        avgDays,
        p50,
        p90,
        trend,
      });
    }

    carriersResult.sort((a, b) => b.total - a.total);

    const allDelivered = carriersResult.reduce((s, c) => s + c.delivered, 0);
    const allOnTime = carriersResult.reduce(
      (s, c) => s + Math.round(c.onTimeRate * c.delivered),
      0,
    );
    const overallOnTimeRate = allDelivered > 0 ? allOnTime / allDelivered : 0;
    const allTransitDays = carriersResult.filter((c) => c.avgDays > 0);
    const avgTransitDays =
      allTransitDays.length > 0
        ? allTransitDays.reduce((s, c) => s + c.avgDays, 0) / allTransitDays.length
        : 0;

    const sortedByOnTime = [...carriersResult]
      .filter((c) => c.delivered >= 5)
      .sort((a, b) => b.onTimeRate - a.onTimeRate);

    return {
      carriers: carriersResult,
      summary: {
        bestPerformer: sortedByOnTime[0]?.carrier || 'N/A',
        worstPerformer: sortedByOnTime[sortedByOnTime.length - 1]?.carrier || 'N/A',
        overallOnTimeRate,
        avgTransitDays,
      },
    };
  }

  private calculateStats(
    allShipments: ShipmentRecord[],
    allQuotes: QuoteRecord[],
  ): ReportStats {
    const activeShipments = allShipments.filter((s) => s.status !== 'archived');

    const total = activeShipments.length;
    const pending = activeShipments.filter(
      (s) => s.status === 'pending',
    ).length;
    const in_transit = activeShipments.filter(
      (s) => s.status === 'in_transit',
    ).length;
    const delivered = activeShipments.filter(
      (s) => s.status === 'delivered',
    ).length;
    const cancelled = activeShipments.filter(
      (s) => s.status === 'cancelled',
    ).length;

    const deliveryRate = total > 0 ? delivered / total : 0;

    const transitTimes: number[] = [];
    for (const s of activeShipments) {
      if (s.deliveredAt && s.createdAt) {
        const days =
          (s.deliveredAt.getTime() - s.createdAt.getTime()) /
          (1000 * 60 * 60 * 24);
        transitTimes.push(days);
      }
    }
    const avgTransitDays =
      transitTimes.length > 0
        ? transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length
        : 0;

    const activeQuotes = allQuotes.filter((q) => q.status !== 'deleted');
    const quoteTotal = activeQuotes.length;
    const converted = activeQuotes.filter(
      (q) => q.status === 'accepted',
    ).length;
    const conversionRate = quoteTotal > 0 ? converted / quoteTotal : 0;

    const prices = activeQuotes
      .map((q) => parseFloat(q.price || '0'))
      .filter((p) => p > 0);
    const avgValue =
      prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    const invoiceShipments = activeShipments.filter(
      (s) => s.billAmount !== null && s.billAmount !== undefined,
    );
    const invoiceCount = invoiceShipments.length;
    const invoiceAmounts = invoiceShipments.map((s) =>
      parseFloat(s.billAmount || '0'),
    );
    const totalRevenue = invoiceAmounts.reduce((a, b) => a + b, 0);
    const avgInvoiceAmount =
      invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

    return {
      shipments: {
        total,
        pending,
        in_transit,
        delivered,
        cancelled,
        deliveryRate,
        avgTransitDays,
      },
      quotes: {
        total: quoteTotal,
        converted,
        conversionRate,
        avgValue,
      },
      invoices: {
        totalRevenue,
        avgInvoiceAmount,
        invoiceCount,
      },
    };
  }
}
