import { Injectable } from '@nestjs/common';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { quotes } from '../../database/schema/quotes';
import { users } from '../../database/schema/user';
import { eq, and, gte, lte, sql, isNull, count, SQL } from 'drizzle-orm';

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
}

export interface ChartDataPoint {
  date: string;
  shipments: number;
  quotes: number;
  delivered: number;
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
  async getReportSummary(options: { organisationId?: string; range: string }) {
    const { organisationId, range } = options;
    const dateRange = this.getDateRange(range);

    const shipmentConditions: SQL[] = [];
    if (organisationId) {
      shipmentConditions.push(eq(shipments.organisationId, organisationId));
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
        this.getChartData(organisationId, dateRange),
        this.getRouteData(organisationId, dateRange),
        this.getCarrierData(organisationId, dateRange),
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

      const quoteConditions: SQL[] = [
        gte(quotes.createdAt, dayStart),
        lte(quotes.createdAt, dayEnd),
        isNull(quotes.deletedAt),
      ];
      if (organisationId) {
        quoteConditions.push(eq(quotes.organisationId, organisationId));
      }

      const [dayShipments, dayQuotes, dayDelivered] = await Promise.all([
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
      ]);

      days.push({
        date: current.toISOString().split('T')[0],
        shipments: Number(dayShipments[0]?.count ?? 0),
        quotes: Number(dayQuotes[0]?.count ?? 0),
        delivered: Number(dayDelivered[0]?.count ?? 0),
      });

      current.setTime(current.getTime() + dayMs);
    }

    return days;
  }

  private async getRouteData(
    organisationId: string | undefined,
    dateRange: { start: Date; end: Date },
  ): Promise<RouteData[]> {
    const conditions: SQL[] = [
      gte(shipments.createdAt, dateRange.start),
      lte(shipments.createdAt, dateRange.end),
    ];
    if (organisationId) {
      conditions.push(eq(shipments.organisationId, organisationId));
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
    dateRange: { start: Date; end: Date },
  ): Promise<CarrierData[]> {
    const conditions: SQL[] = [
      gte(shipments.createdAt, dateRange.start),
      lte(shipments.createdAt, dateRange.end),
    ];
    if (organisationId) {
      conditions.push(eq(shipments.organisationId, organisationId));
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

    return result.map((r) => {
      const total = Number(r.total) || 0;
      const delivered = Number(r.delivered) || 0;
      const avgDays = total > 0 ? Number(r.totalDays) / total : 0;

      return {
        carrier: r.carrierCode,
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
    };
  }
}
