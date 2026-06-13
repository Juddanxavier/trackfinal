import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { db } from '../../database';
import { shipments, shipmentEvents } from '../../database/schema/shipments';
import { organisations } from '../../database/schema/organisations';
import {
  eq,
  and,
  or,
  desc,
  sql,
  isNull,
  isNotNull,
  inArray,
} from 'drizzle-orm';
import { SeventeenTrackService } from '../tracking/seventeen-track.service';
import { CarriersService } from '../carriers/carriers.service';
import { NotificationService } from '../notifications/notification.service';
import { EventsGateway } from '../events/events.gateway';

function detectPhoneCountry(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  const patterns: [RegExp, string][] = [
    [/^1(?!1$)/, 'US'],
    [/^44/, 'GB'],
    [/^61/, 'AU'],
    [/^49/, 'DE'],
    [/^33/, 'FR'],
    [/^86/, 'CN'],
    [/^81/, 'JP'],
    [/^91/, 'IN'],
    [/^55/, 'BR'],
    [/^52/, 'MX'],
  ];
  for (const [regex, code] of patterns) {
    if (regex.test(clean)) return code;
  }
  return 'Unknown';
}

function generateWhiteLabelCode(orgSlug: string): string {
  const prefix = orgSlug.substring(0, 3).toUpperCase();
  const digits = '0123456789';
  let code = prefix;
  for (let i = 0; i < 11; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

interface CreateShipmentData {
  organisationId: string;
  trackingNumber: string;
  carrierCode: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone: string;
  userId?: string;
  assignedToId?: string | null;
  branchId?: string | null;
  billAmount?: number | null;
}

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger('ShipmentsService');

  constructor(
    private readonly seventeenTrackService: SeventeenTrackService,
    private readonly carriersService: CarriersService,
    private readonly notificationService: NotificationService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private invalidate(organisationId: string) {
    try {
      this.eventsGateway.emitToOrganisation(
        organisationId,
        'invalidate:shipments',
        { timestamp: Date.now() },
      );
    } catch {
      // Socket connection not available
    }
  }

  private async waitForTrackingData(
    trackingNumber: string,
    carrierCode: string,
    maxAttempts = 5,
    delayMs = 2000,
  ): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const tracking = await this.seventeenTrackService.getTracking(
        trackingNumber,
        carrierCode,
      );
      if (tracking && tracking.status && tracking.status !== 'not_found') {
        return tracking;
      }
      if (i < maxAttempts - 1) {
        this.logger.debug(
          `Waiting for tracking data... attempt ${i + 1}/${maxAttempts}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return null;
  }

  private async resolveTrackingFrom17Track(
    trackingNumber: string,
    carrierCode: string,
  ) {
    this.logger.debug('Fetching tracking from 17TRACK...');
    let trackingData = await this.seventeenTrackService.getTracking(
      trackingNumber,
      carrierCode,
    );

    if (!trackingData || trackingData.status === 'not_found') {
      this.logger.debug('No existing tracking, registering...');
      const registerResult = await this.seventeenTrackService.register(
        trackingNumber,
        carrierCode,
        { tag: trackingNumber },
      );

      if (registerResult.success) {
        this.logger.debug('Registered, waiting for tracking data...');
        const resolvedCarrier = registerResult.carrierCode || carrierCode;
        trackingData = await this.waitForTrackingData(
          trackingNumber,
          resolvedCarrier,
        );
        if (trackingData) {
          this.logger.debug(
            'Got tracking data after registration:',
            trackingData.status,
          );
        }
        return { trackingData, carrierCode: resolvedCarrier };
      } else {
        this.logger.warn('Registration failed:', registerResult.error);
      }
    }

    return { trackingData, carrierCode };
  }

  private async sendInitialNotifications(
    shipment: typeof shipments.$inferSelect,
    status: string,
    org: any,
  ) {
    const initialStatusToNotify =
      status === 'in_transit' || status === 'delivered';
    const isSelfAssigned =
      shipment.userId && shipment.userId === shipment.assignedToId;
    if (isSelfAssigned || !initialStatusToNotify) return;
    if (
      !shipment.recipientEmail &&
      !shipment.recipientPhone &&
      !shipment.userId
    )
      return;

    const titleKey =
      status === 'delivered' ? 'shipment.delivered' : 'shipment.in_transit';
    const trackingDomain =
      org?.trackingDomain ||
      org?.websiteUrl ||
      process.env.DEFAULT_TRACKING_DOMAIN ||
      'https://www.gajantraders.com';
    const trackingUrl = `${trackingDomain}/track/${shipment.whiteLabelTrackingCode}`;

    const results = await this.notificationService.sendToAll({
      organisationId: shipment.organisationId,
      userId: shipment.userId || undefined,
      recipientEmail: shipment.recipientEmail || undefined,
      recipientPhone: shipment.recipientPhone || undefined,
      titleKey,
      data: {
        trackingNumber: shipment.trackingNumber,
        carrierCode: shipment.carrierCode,
        status,
        recipientName: shipment.recipientName,
        destinationCountry: shipment.destinationCountry,
        whiteLabelCode: shipment.whiteLabelTrackingCode,
        trackingUrl,
        orgName: org?.name,
      },
    });

    this.logger.debug(
      `Notification results:`,
      results
        .map((r) => `${r.channel}: ${r.success ? 'sent' : 'failed'}`)
        .join(', '),
    );
  }

  async create(data: CreateShipmentData) {
    this.logger.log('[CREATE] Tracking:', data.trackingNumber);

    if (!data.trackingNumber?.trim()) {
      throw new BadRequestException('Tracking number is required');
    }

    const isValidCarrier = await this.carriersService.isValidCarrier(
      data.carrierCode,
    );
    if (!isValidCarrier && data.carrierCode !== 'unknown') {
      this.logger.warn(
        `Invalid carrier code: ${data.carrierCode}, defaulting to unknown`,
      );
    }

    const [existing] = await db
      .select()
      .from(shipments)
      .where(
        and(
          eq(shipments.trackingNumber, data.trackingNumber),
          eq(shipments.organisationId, data.organisationId),
          isNull(shipments.deletedAt),
        ),
      );

    if (existing) {
      throw new ConflictException('Tracking number already exists');
    }

    const [org] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, data.organisationId));
    const orgCountry = org?.countryCode || 'Unknown';
    const orgSlug = org?.slug || 'GT';
    const notifyPhoneCountry = detectPhoneCountry(data.recipientPhone);

    let carrierCode = data.carrierCode || 'unknown';
    let originCountry = orgCountry;
    let destinationCountry = orgCountry;
    let status: 'pending' | 'in_transit' | 'delivered' | 'exception' =
      'pending';
    let statusRaw = 'InfoReceived';
    let events: any[] = [];

    try {
      const trackingResult = await this.resolveTrackingFrom17Track(
        data.trackingNumber,
        data.carrierCode,
      );
      const trackingData = trackingResult.trackingData;
      carrierCode = trackingResult.carrierCode;

      if (trackingData?.status && trackingData.status !== 'not_found') {
        this.logger.debug('Using tracking data, status:', trackingData.status);
        carrierCode = trackingData.carrierCode || carrierCode;
        originCountry = trackingData.originCountry || originCountry;
        destinationCountry =
          trackingData.destinationCountry || destinationCountry;
        status = trackingData.status;
        statusRaw = trackingData.statusRaw;
        events = trackingData.events || [];
      }
    } catch (error: any) {
      this.logger.warn(
        '17TRACK error, creating with pending status:',
        error.message,
      );
    }

    const [shipment] = await db
      .insert(shipments)
      .values({
        organisationId: data.organisationId,
        branchId: data.branchId || null,
        trackingNumber: data.trackingNumber,
        whiteLabelTrackingCode: generateWhiteLabelCode(orgSlug),
        carrierCode,
        recipientName: data.recipientName,
        originCountry,
        destinationCountry,
        recipientEmail: data.recipientEmail || null,
        recipientPhone: data.recipientPhone || null,
        userId: data.userId || null,
        assignedToId: data.assignedToId || null,
        status,
        billAmount: data.billAmount != null ? String(data.billAmount) : null,
        notifyEmail: data.recipientEmail || null,
        track17Data: {
          lastSync: new Date().toISOString(),
          originCountry,
          destinationCountry,
          notifyPhoneCountry,
          lastStatus: status,
        },
      })
      .returning();

    if (events.length > 0) {
      const eventValues = events.map((event) => ({
        shipmentId: shipment.id,
        status: event.status || status,
        statusRaw: event.statusRaw || statusRaw,
        description: event.description || null,
        location: event.location || null,
        eventTime: event.eventTime ? new Date(event.eventTime) : new Date(),
      }));

      await db.insert(shipmentEvents).values(eventValues);
      this.logger.debug(`Saved ${eventValues.length} events`);
    }

    this.logger.log(`Shipment created: ${shipment.id}, status: ${status}`);
    await this.sendInitialNotifications(shipment, status, org);
    this.invalidate(data.organisationId);

    return shipment;
  }

  async findAll(data: {
    organisationId?: string;
    branchId?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    archived?: boolean;
    deleted?: boolean;
  }) {
    const page = data.page || 1;
    const limit = data.limit || 20;
    const offset = (page - 1) * limit;

    const where: any[] = [];
    if (data.organisationId) {
      where.push(eq(shipments.organisationId, data.organisationId));
    }

    if (data.branchId) {
      where.push(eq(shipments.branchId, data.branchId));
    }

    if (data.search) {
      where.push(
        sql`(${shipments.trackingNumber} ILIKE ${'%' + data.search + '%'} OR ${shipments.recipientEmail} ILIKE ${'%' + data.search + '%'} OR ${shipments.notifyEmail} ILIKE ${'%' + data.search + '%'})`,
      );
    }

    if (data.status && data.status !== 'all') {
      where.push(eq(shipments.status, data.status as any));
    }

    if (data.archived) {
      where.push(isNotNull(shipments.archivedAt));
    } else {
      where.push(isNull(shipments.archivedAt));
    }

    if (data.deleted) {
      where.push(isNotNull(shipments.deletedAt));
    } else {
      where.push(isNull(shipments.deletedAt));
    }

    const whereClause = where.length > 0 ? and(...where) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shipments)
      .where(whereClause);

    const result = await db
      .select()
      .from(shipments)
      .where(whereClause)
      .orderBy(desc(shipments.createdAt))
      .limit(limit)
      .offset(offset);

    let carrierMap = new Map<string, string>();
    try {
      const carrierCodes = [
        ...new Set(result.map((s) => s.carrierCode).filter(Boolean)),
      ];
      const carriers =
        carrierCodes.length > 0
          ? await this.carriersService.getCarriersByKeys(carrierCodes)
          : [];
      carrierMap = new Map(carriers.map((c) => [c.key, c.name_en]));
    } catch (err) {
      this.logger.warn('Failed to load carrier names:', err);
    }

    const enrichedResult = result.map((shipment) => ({
      ...shipment,
      carrierName: carrierMap.get(shipment.carrierCode) || null,
    }));

    return {
      data: enrichedResult,
      total: countResult?.count || 0,
      page,
      limit,
      totalPages: Math.ceil((countResult?.count || 0) / limit),
    };
  }

  async findOne(id: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    let carrierName: string | null = null;
    if (shipment.carrierCode) {
      const carrier = await this.carriersService.getCarrierByKey(
        shipment.carrierCode,
      );
      carrierName = carrier?.name_en || null;
    }

    const events = await db
      .select()
      .from(shipmentEvents)
      .where(eq(shipmentEvents.shipmentId, id))
      .orderBy(desc(shipmentEvents.eventTime));

    return { ...shipment, carrierName, events };
  }

  async findByTrackingNumber(trackingNumber: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber));

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    let carrierName: string | null = null;
    if (shipment.carrierCode) {
      const carrier = await this.carriersService.getCarrierByKey(
        shipment.carrierCode,
      );
      carrierName = carrier?.name_en || null;
    }

    const events = await db
      .select()
      .from(shipmentEvents)
      .where(eq(shipmentEvents.shipmentId, shipment.id))
      .orderBy(desc(shipmentEvents.eventTime));

    return {
      trackingNumber: shipment.trackingNumber,
      carrierCode: shipment.carrierCode,
      carrierName,
      status: shipment.status,
      originCountry: shipment.originCountry,
      destinationCountry: shipment.destinationCountry,
      recipientName: shipment.recipientName,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
      deliveredAt: shipment.deliveredAt,
      events,
    };
  }

  async findByWhiteLabelCode(code: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.whiteLabelTrackingCode, code));

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    let carrierName: string | null = null;
    if (shipment.carrierCode) {
      const carrier = await this.carriersService.getCarrierByKey(
        shipment.carrierCode,
      );
      carrierName = carrier?.name_en || null;
    }

    const events = await db
      .select()
      .from(shipmentEvents)
      .where(eq(shipmentEvents.shipmentId, shipment.id))
      .orderBy(desc(shipmentEvents.eventTime));

    return {
      trackingNumber: shipment.trackingNumber,
      carrierCode: shipment.carrierCode,
      carrierName,
      status: shipment.status,
      originCountry: shipment.originCountry,
      destinationCountry: shipment.destinationCountry,
      recipientName: shipment.recipientName,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
      deliveredAt: shipment.deliveredAt,
      events,
    };
  }

  async updateStatus(
    id: string,
    status: string,
    eventData?: {
      statusRaw?: string;
      description?: string;
      location?: string;
      eventTime?: Date;
    },
  ) {
    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!existing) {
      throw new NotFoundException('Shipment not found');
    }

    const [org] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, existing.organisationId));

    const trackingDomain =
      org?.trackingDomain ||
      org?.websiteUrl ||
      process.env.DEFAULT_TRACKING_DOMAIN ||
      'https://www.gajantraders.com';
    const trackingUrl = `${trackingDomain}/track/${existing.whiteLabelTrackingCode}`;

    if (existing.status === status) {
      this.logger.debug(`Status unchanged (${status}), skipping notification`);
      return existing;
    }

    const isSelfAssigned =
      existing.userId && existing.userId === existing.assignedToId;
    if (isSelfAssigned) {
      this.logger.debug(`Self-assigned shipment, skipping notification`);
    }

    const [updated] = await db
      .update(shipments)
      .set({
        status: status as any,
        deliveredAt: status === 'delivered' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, id))
      .returning();

    if (eventData) {
      await db.insert(shipmentEvents).values({
        shipmentId: id,
        status,
        statusRaw: eventData.statusRaw || null,
        description: eventData.description || null,
        location: eventData.location || null,
        eventTime: eventData.eventTime || new Date(),
      });
    }

    if (
      !isSelfAssigned &&
      (updated.userId || updated.recipientEmail || updated.recipientPhone)
    ) {
      const titleKey =
        status === 'delivered'
          ? 'shipment.delivered'
          : status === 'in_transit'
            ? 'shipment.in_transit'
            : `shipment.${status}`;

      this.logger.debug(
        `Sending notification for shipment ${updated.trackingNumber}, status: ${status}`,
      );

      const results = await this.notificationService.sendToAll({
        organisationId: updated.organisationId,
        userId: updated.userId || undefined,
        recipientEmail: updated.recipientEmail || undefined,
        recipientPhone: updated.recipientPhone || undefined,
        titleKey,
        data: {
          trackingNumber: updated.trackingNumber,
          carrierCode: updated.carrierCode,
          status,
          location: eventData?.location,
          deliveredAt:
            status === 'delivered'
              ? new Date().toLocaleDateString()
              : undefined,
          recipientName: existing.recipientName,
          destinationCountry: existing.destinationCountry,
          whiteLabelCode: existing.whiteLabelTrackingCode,
          trackingUrl,
          orgName: org?.name,
        },
      });

      this.logger.debug(
        `Notification results:`,
        results
          .map((r) => `${r.channel}: ${r.success ? 'sent' : 'failed'}`)
          .join(', '),
      );
    }

    this.invalidate(updated.organisationId);
    return updated;
  }

  async archive(id: string, organisationId?: string) {
    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!existing) {
      throw new NotFoundException('Shipment not found');
    }

    if (organisationId && existing.organisationId !== organisationId) {
      throw new NotFoundException('Shipment not found');
    }

    if (existing.archivedAt) {
      return {
        id,
        archivedAt: existing.archivedAt,
        message: 'Already archived',
      };
    }

    await db
      .update(shipments)
      .set({ archivedAt: new Date() })
      .where(eq(shipments.id, id));

    this.invalidate(existing.organisationId);
    return { id, archivedAt: new Date() };
  }

  async unarchive(id: string, organisationId?: string) {
    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!existing) {
      throw new NotFoundException('Shipment not found');
    }

    if (organisationId && existing.organisationId !== organisationId) {
      throw new NotFoundException('Shipment not found');
    }

    await db
      .update(shipments)
      .set({ archivedAt: null })
      .where(eq(shipments.id, id));

    this.invalidate(existing.organisationId);
    return { id, archivedAt: null };
  }

  async softDelete(id: string, organisationId?: string) {
    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!existing) {
      throw new NotFoundException('Shipment not found');
    }

    if (organisationId && existing.organisationId !== organisationId) {
      throw new NotFoundException('Shipment not found');
    }

    if (existing.deletedAt) {
      return { id, deletedAt: existing.deletedAt, message: 'Already deleted' };
    }

    await db
      .update(shipments)
      .set({ deletedAt: new Date() })
      .where(eq(shipments.id, id));

    this.invalidate(existing.organisationId);
    return { id, deletedAt: new Date() };
  }

  async restore(id: string, organisationId?: string) {
    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!existing) {
      throw new NotFoundException('Shipment not found');
    }

    if (organisationId && existing.organisationId !== organisationId) {
      throw new NotFoundException('Shipment not found');
    }

    await db
      .update(shipments)
      .set({ deletedAt: null })
      .where(eq(shipments.id, id));

    this.invalidate(existing.organisationId);
    return { id, deletedAt: null };
  }

  async getStats(organisationId: string, branchId?: string) {
    if (!organisationId) {
      return {
        total: 0,
        pending: 0,
        inTransit: 0,
        delivered: 0,
        exception: 0,
        cancelled: 0,
      };
    }

    const filters: any[] = [
      eq(shipments.organisationId, organisationId),
      isNull(shipments.deletedAt),
    ];
    if (branchId) filters.push(eq(shipments.branchId, branchId));

    const results = await db
      .select({
        status: shipments.status,
        count: sql<number>`count(*)`,
      })
      .from(shipments)
      .where(and(...filters))
      .groupBy(shipments.status);

    const counts = {
      total: 0,
      pending: 0,
      inTransit: 0,
      delivered: 0,
      exception: 0,
      cancelled: 0,
    };
    for (const r of results) {
      const status = String(r.status);
      counts[status] = Number(r.count);
      counts.total += Number(r.count);
    }

    const activity = await this.getActivity(organisationId, branchId, 7);
    const totalTrend = activity.map((a) => a.total);
    const pendingTrend = activity.map((a) => a.pending || 0);
    const inTransitTrend = activity.map((a) => a.inTransit || 0);
    const deliveredTrend = activity.map((a) => a.delivered || 0);

    return {
      ...counts,
      totalTrend,
      pendingTrend,
      inTransitTrend,
      deliveredTrend,
    };
  }

  async getActivity(
    organisationId: string,
    branchId?: string,
    days: number = 30,
  ) {
    if (!organisationId) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const branchFilter = branchId ? sql`AND branch_id = ${branchId}` : sql``;

    const result = await db.execute(sql`
      SELECT 
        date(created_at) as date,
        status,
        count(*) as count
      FROM shipments
      WHERE organisation_id = ${organisationId}
        ${branchFilter}
        AND created_at >= ${startDate}
      GROUP BY date(created_at), status
      ORDER BY date(created_at)
    `);

    const rows = (result as any).rows || [];

    if (rows.length === 0) {
      return [];
    }

    const byDate: Record<
      string,
      { total: number; pending: number; inTransit: number; delivered: number }
    > = {};
    for (const r of rows) {
      const dateStr = String(r.date);
      if (!byDate[dateStr]) {
        byDate[dateStr] = { total: 0, pending: 0, inTransit: 0, delivered: 0 };
      }
      const cnt = Number(r.count);
      byDate[dateStr].total += cnt;
      if (r.status === 'pending') byDate[dateStr].pending = cnt;
      if (r.status === 'in_transit') byDate[dateStr].inTransit = cnt;
      if (r.status === 'delivered') byDate[dateStr].delivered = cnt;
    }

    return Object.entries(byDate).map(([date, data]) => ({ date, ...data }));
  }

  async getDestinations(
    organisationId: string,
    branchId?: string,
    limit: number = 6,
  ) {
    if (!organisationId) return [];

    const filters: any[] = [
      eq(shipments.organisationId, organisationId),
      isNull(shipments.deletedAt),
      isNotNull(shipments.destinationCountry),
    ];
    if (branchId) filters.push(eq(shipments.branchId, branchId));

    const result = await db
      .select({
        destinationCountry: shipments.destinationCountry,
        count: sql<number>`count(*)`,
      })
      .from(shipments)
      .where(and(...filters))
      .groupBy(shipments.destinationCountry)
      .orderBy(sql`count(*) desc`)
      .limit(limit);

    return result.map((r) => ({
      country: r.destinationCountry || 'Unknown',
      count: r.count,
    }));
  }

  async findByUserId(userId: string) {
    this.logger.log(`[FIND BY USER] Fetching shipments for user: ${userId}`);

    const results = await db
      .select({
        shipment: shipments,
        latestLocation: sql<string | null>`(
          SELECT location FROM shipment_events 
          WHERE shipment_events.shipment_id = shipments.id 
          ORDER BY event_time DESC LIMIT 1
        )`.as('latest_location'),
        latestStatus: sql<string | null>`(
          SELECT status FROM shipment_events 
          WHERE shipment_events.shipment_id = shipments.id 
          ORDER BY event_time DESC LIMIT 1
        )`.as('latest_status'),
      })
      .from(shipments)
      .where(
        and(
          or(eq(shipments.userId, userId), eq(shipments.assignedToId, userId)),
          isNull(shipments.deletedAt),
        ),
      )
      .orderBy(desc(shipments.createdAt));

    const shipmentsWithLocation = results.map((row) => ({
      ...row.shipment,
      currentLocation: row.latestLocation,
      currentStatus: row.latestStatus,
    }));

    this.logger.log(
      `[FIND BY USER] Found ${shipmentsWithLocation.length} shipments for user ${userId}`,
    );
    return shipmentsWithLocation;
  }

  async findByUserAndOrganisation(
    userId: string,
    organisationId: string | null,
  ) {
    this.logger.log(
      `[FIND BY USER+ORG] Fetching shipments for user: ${userId}, org: ${organisationId}`,
    );

    if (organisationId) {
      const results = await db
        .select()
        .from(shipments)
        .where(
          and(
            eq(shipments.organisationId, organisationId),
            isNull(shipments.deletedAt),
          ),
        )
        .orderBy(desc(shipments.createdAt));

      this.logger.log(
        `[FIND BY USER+ORG] Found ${results.length} shipments for org ${organisationId}`,
      );
      return results;
    }

    return this.findByUserId(userId);
  }

  async findByOrganisation(organisationId: string) {
    this.logger.log(
      `[FIND BY ORG] Fetching all shipments for organisation: ${organisationId}`,
    );

    const results = await db
      .select({
        shipment: shipments,
        latestLocation: sql<string | null>`(
          SELECT location FROM shipment_events
          WHERE shipment_events.shipment_id = shipments.id
          ORDER BY event_time DESC LIMIT 1
        )`.as('latest_location'),
        latestStatus: sql<string | null>`(
          SELECT status FROM shipment_events
          WHERE shipment_events.shipment_id = shipments.id
          ORDER BY event_time DESC LIMIT 1
        )`.as('latest_status'),
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.organisationId, organisationId),
          isNull(shipments.deletedAt),
        ),
      )
      .orderBy(desc(shipments.createdAt));

    const shipmentsWithLocation = results.map((row) => ({
      ...row.shipment,
      currentLocation: row.latestLocation,
      currentStatus: row.latestStatus,
    }));

    this.logger.log(
      `[FIND BY ORG] Found ${shipmentsWithLocation.length} shipments`,
    );
    return shipmentsWithLocation;
  }

  async update(
    id: string,
    data: {
      recipientName?: string;
      recipientEmail?: string;
      recipientPhone?: string;
      branchId?: string;
      billAmount?: number | null;
    },
  ) {
    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!existing) {
      throw new NotFoundException('Shipment not found');
    }

    const updateData: Record<string, any> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.billAmount !== undefined) {
      updateData.billAmount =
        data.billAmount != null ? String(data.billAmount) : null;
    }

    const [updated] = await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id))
      .returning();

    this.invalidate(updated.organisationId);
    return updated;
  }
}
