import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { eq, and, like, or, desc, asc } from 'drizzle-orm';
import { UsersService } from '../users/services';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingProviderFactory } from './tracking.factory';

@Injectable()
export class ShipmentsService {
  constructor(
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private trackingFactory: TrackingProviderFactory,
  ) {}

  async create(data: {
    organisationId: string;
    trackingNumber: string;
    carrierCode: string;
    senderEmail: string;
    recipientName: string;
    recipientPhone?: string;
    originCountry?: string;
    destinationCountry?: string;
    goodsType?: string;
    weight?: string;
  }) {
    console.log(
      '[ShipmentsService] CREATE shipment:',
      JSON.stringify(data, null, 2),
    );

    const whiteLabelCode = this.generateWhiteLabelCode();

    let finalUserId: string | null = null;

    if (data.senderEmail) {
      const userByEmail = await this.usersService.findByEmail(data.senderEmail);
      if (userByEmail) {
        finalUserId = userByEmail.id;
      }
    }

    if (!finalUserId && data.recipientPhone) {
      const userByPhone = await this.usersService.findByPhoneNumber(
        data.recipientPhone,
      );
      if (userByPhone) {
        finalUserId = userByPhone.id;
      }
    }

    let originCountry = data.originCountry;
    let destinationCountry = data.destinationCountry;
    let goodsType = data.goodsType;
    let weight = data.weight;

    let trackData: any = null;
    try {
      trackData = await this.trackingFactory.trackWithRetry(
        data.carrierCode,
        data.trackingNumber,
      );
      console.log(
        '[ShipmentsService] Track data fetched:',
        trackData ? 'yes' : 'no/null (pending first scan)',
      );
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    }

    if (trackData) {
      if (!originCountry && trackData.origin) {
        originCountry = trackData.origin;
      }
      if (!destinationCountry && trackData.destination) {
        destinationCountry = trackData.destination;
      }
      if (!goodsType && trackData.description) {
        goodsType = trackData.description;
      }
      if (!weight && trackData.weight) {
        weight = trackData.weight;
      }
    }

    let carrierCode = data.carrierCode;
    if (!carrierCode) {
      const detection = await this.detectCarrier(data.trackingNumber);
      if (detection.detected && detection.carrierCode) {
        carrierCode = detection.carrierCode;
      }
    }

    console.log('[ShipmentsService] Inserting shipment...');
    const [shipment] = await db
      .insert(shipments)
      .values({
        organisationId: data.organisationId,
        userId: finalUserId,
        trackingNumber: data.trackingNumber,
        whiteLabelTrackingCode: whiteLabelCode,
        carrierCode: carrierCode || data.carrierCode || 'unknown',
        recipientName: data.recipientName,
        recipientEmail: data.senderEmail,
        recipientPhone: data.recipientPhone || null,
        originCountry: originCountry || 'unknown',
        destinationCountry: destinationCountry || 'unknown',
        goodsType: goodsType || 'general',
        weight: weight || null,
        status: 'pending',
      } as any)
      .returning();
    console.log('[ShipmentsService] Shipment inserted:', shipment?.id);

    if (trackData) {
      await db
        .update(shipments)
        .set({
          track17Data: trackData,
          updatedAt: new Date(),
        } as any)
        .where(eq(shipments.id, shipment.id));
      console.log(
        `[ShipmentsService] Saved tracking data to shipment ${shipment.id}`,
      );
    }

    if (finalUserId) {
      await this.notificationsService.create(data.organisationId, {
        userId: finalUserId,
        titleKey: 'shipment.created',
        data: {
          shipmentId: shipment.id,
          whiteLabelCode,
          trackingNumber: data.trackingNumber,
          carrierCode: data.carrierCode,
        },
      });
    }

    return this.findById(shipment.id);
  }

  async findById(id: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async findByUser(userId: string) {
    return db.select().from(shipments).where(eq(shipments.userId, userId));
  }

  async findByUserPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const offset = (page - 1) * limit;
    const allShipments = await db
      .select()
      .from(shipments)
      .where(eq(shipments.userId, userId));
    const total = allShipments.length;
    const data = allShipments.slice(offset, offset + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByOrganisation(organisationId: string) {
    return db
      .select()
      .from(shipments)
      .where(eq(shipments.organisationId, organisationId));
  }

  async findWithPagination(options: {
    organisationId?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const {
      organisationId,
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const conditions: any[] = [];

    if (organisationId) {
      conditions.push(eq(shipments.organisationId, organisationId));
    }
    if (status) {
      conditions.push(eq(shipments.status, status as any));
    }
    if (search) {
      conditions.push(
        or(
          like(shipments.trackingNumber, `%${search}%`),
          like(shipments.recipientName, `%${search}%`),
          like(shipments.recipientEmail, `%${search}%`),
          like(shipments.carrierCode, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;

    const orderColumn: any =
      sortBy === 'trackingNumber'
        ? shipments.trackingNumber
        : sortBy === 'carrierCode'
          ? shipments.carrierCode
          : sortBy === 'recipientName'
            ? shipments.recipientName
            : sortBy === 'status'
              ? shipments.status
              : shipments.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [data, allData] = await Promise.all([
      db
        .select()
        .from(shipments)
        .where(whereClause)
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset),
      db.select().from(shipments).where(whereClause),
    ]);

    const total = allData.length;
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async getStats(organisationId?: string) {
    try {
      const conditions: any[] = [];

      if (organisationId) {
        conditions.push(eq(shipments.organisationId, organisationId));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const allShipments = whereClause
        ? await db.select().from(shipments).where(whereClause)
        : await db.select().from(shipments);

      const activeShipments = allShipments.filter(
        (s) => s.status !== 'archived',
      );
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

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = activeShipments.filter(
        (s) => s.createdAt && new Date(s.createdAt) >= sevenDaysAgo,
      ).length;

      return { total, pending, in_transit, delivered, cancelled, recent };
    } catch (error) {
      console.error('[ShipmentsService] getStats error:', error);
      throw error;
    }
  }

  async findByWhiteLabelCode(code: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.whiteLabelTrackingCode, code));
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async update(
    id: string,
    data: {
      assignedToId?: string;
      recipientEmail?: string;
      recipientPhone?: string;
    },
  ) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.assignedToId !== undefined)
      updateData.assignedToId = data.assignedToId;
    if (data.recipientEmail !== undefined)
      updateData.recipientEmail = data.recipientEmail;
    if (data.recipientPhone !== undefined)
      updateData.recipientPhone = data.recipientPhone;

    await db.update(shipments).set(updateData).where(eq(shipments.id, id));
    return this.findById(id);
  }

  async refreshTrack17Data(id: string) {
    const shipment = await this.findById(id);
    const trackData = await this.trackingFactory.trackWithRetry(
      shipment.carrierCode,
      shipment.trackingNumber,
    );
    if (trackData) {
      const updateData: any = {
        track17Data: trackData,
        updatedAt: new Date(),
      };
      if (trackData.status === 'delivered' && shipment.status !== 'delivered') {
        updateData.status = 'delivered';
        updateData.deliveredAt = new Date();
      }
      await db.update(shipments).set(updateData).where(eq(shipments.id, id));
    }
    return this.findById(id);
  }

  async delete(id: string, deletedBy: string, reason?: string) {
    const shipment = await this.findById(id);
    await db
      .update(shipments)
      .set({
        status: 'cancelled',
        deletedAt: new Date(),
        deletedBy: deletedBy,
        deletedReason: reason || null,
        updatedAt: new Date(),
      } as any)
      .where(eq(shipments.id, id));
    return { message: 'Shipment cancelled successfully', id };
  }

  async processWebhookUpdate(
    carrierCode: string,
    trackingNumber: string,
    trackData: any,
  ) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(
        and(
          eq(shipments.carrierCode, carrierCode),
          eq(shipments.trackingNumber, trackingNumber),
        ),
      );

    if (!shipment) {
      console.log(
        `[Webhook] Shipment not found for ${carrierCode}/${trackingNumber}`,
      );
      return null;
    }

    const updateData: any = {
      track17Data: trackData,
      updatedAt: new Date(),
    };

    if (trackData.status === 'delivered' && shipment.status !== 'delivered') {
      updateData.status = 'delivered';
      updateData.deliveredAt = new Date();
    }

    await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, shipment.id));

    return this.findById(shipment.id);
  }

  async detectCarrier(
    trackingNumber: string,
  ): Promise<{ detected: boolean; carrierCode?: string; trackData?: any }> {
    console.log(`[ShipmentsService] detectCarrier: ${trackingNumber}`);

    // First, try pattern matching (fast, free, no API)
    const detectedCarrier = this.detectCarrierByPattern(trackingNumber);
    console.log(
      `[ShipmentsService] Pattern match result: ${detectedCarrier || 'none'}`,
    );

    if (detectedCarrier) {
      // Try to get tracking data from Track17
      const trackResult = await this.trackingFactory
        .getProvider()
        .track(detectedCarrier, trackingNumber)
        .catch(() => null);
      console.log(
        `[ShipmentsService] Track result: ${trackResult ? 'success' : 'null'}`,
      );

      if (trackResult) {
        console.log('[ShipmentsService] ========== TRACKING DATA ==========');
        console.log(JSON.stringify(trackResult, null, 2));
        console.log('[ShipmentsService] ====================================');
        return {
          detected: true,
          carrierCode: detectedCarrier,
          trackData: trackResult,
        };
      }

      // Return detected even without track data (carrier detected, but no tracking events yet)
      return {
        detected: true,
        carrierCode: detectedCarrier,
        trackData: null,
      };
    }

    // Fallback to API detection
    const result = await this.trackingFactory
      .getProvider()
      .detectCarrier(trackingNumber);
    console.log(`[ShipmentsService] API detect result:`, result);

    if (!result) {
      return { detected: false };
    }

    if (result.carrierCode) {
      const trackResult = await this.trackingFactory
        .getProvider()
        .track(result.carrierCode, trackingNumber);
      console.log(
        `[ShipmentsService] API track result: ${trackResult ? 'success' : 'null'}`,
      );

      if (trackResult) {
        return {
          detected: true,
          carrierCode: result.carrierCode,
          trackData: trackResult,
        };
      }

      return {
        detected: true,
        carrierCode: result.carrierCode,
        trackData: null,
      };
    }

    return { detected: false };
  }

  private detectCarrierByPattern(trackingNumber: string): string | null {
    // Carrier patterns: prefix -> carrier code
    const patterns: Array<{ prefix: RegExp; carrier: string }> = [
      // DHL
      { prefix: /^(\d{10}|\d{12}|JD\d{9}[A-Z]{2}|JD\d{13})$/i, carrier: 'dhl' },
      { prefix: /^(\d{10}|\d{12})$/i, carrier: 'dhl' },
      // UPS
      { prefix: /^1Z[A-Z0-9]{16}$/i, carrier: 'ups' },
      // FedEx
      {
        prefix:
          /^(96\d{12}|96\d{15}|7489\d{12}|7489\d{15}|6129\d{12}|6129\d{15})$/i,
        carrier: 'fedex',
      },
      // USPS
      {
        prefix:
          /^(\d{20}|\d{22}|94\d{20}|92\d{20}|93\d{20}|94\d{22}|92\d{22}|93\d{22})$/i,
        carrier: 'usps',
      },
      // Royal Mail
      { prefix: /^(GB|A[BCD])\d{9}GB$/i, carrier: 'royalmail' },
      // Australia Post
      { prefix: /^(\d{10}|\d{2}L\d{8}|\d{8}L\d{8})$/i, carrier: 'auspost' },
      // China Post
      { prefix: /^(RA|CN|ER|RG|LA)\d{9,13}$/i, carrier: 'chinapost' },
      // Japan Post
      { prefix: /^[A-Z]{2}\d{9}JP$/i, carrier: 'japanpost' },
      // Deutsche Post / DHL Germany
      { prefix: /^\d{10,12}$/i, carrier: 'dpdhl' },
      // TNT
      { prefix: /^\d{8,9}$/i, carrier: 'tnt' },
      // Aramex
      { prefix: /^(\d{10}|\d{12})$/i, carrier: 'aramex' },
      // Purolator
      { prefix: /^\d{10,12}$/i, carrier: 'purolator' },
      // Hermes / Evri
      { prefix: /^Y\d{14}$/i, carrier: 'evri' },
      // YunExpress
      { prefix: /^YT\d{12,14}$/i, carrier: 'yunexpress' },
      // 4PX
      { prefix: /^(\d{10}|\d{12})$/i, carrier: '4px' },
      // SF Express
      { prefix: /^SF\d{12,15}$/i, carrier: 'sfer' },
      // ZTO Express
      { prefix: /^ZT\d{12,15}$/i, carrier: 'zto' },
      // YTO Express
      { prefix: /^YT\d{12,15}$/i, carrier: 'yto' },
      // STO Express
      { prefix: /^STO\d{12,15}$/i, carrier: 'sto' },
      // Best Express
      { prefix: /^BT\d{12,15}$/i, carrier: 'best' },
    ];

    // Try simple prefix matching first (most common carriers by first few chars)
    const prefixes: Record<string, string> = {
      '1Z': 'ups',
      '96': 'fedex',
      '94': 'usps',
      '92': 'usps',
      '93': 'usps',
      JD: 'dhl',
      SF: 'sfer',
      YT: 'yunexpress',
      ZT: 'zto',
      ST: 'sto',
      BT: 'best',
      Y: 'evri',
      RA: 'chinapost',
      CN: 'chinapost',
      GB: 'royalmail',
      LA: 'chinapost',
      ER: 'chinapost',
      RG: 'chinapost',
    };

    const firstChars = trackingNumber.substring(0, 2).toUpperCase();
    if (prefixes[firstChars]) {
      return prefixes[firstChars];
    }

    // Try first 3 chars
    const prefix3 = trackingNumber.substring(0, 3).toUpperCase();
    if (prefixes[prefix3]) {
      return prefixes[prefix3];
    }

    // Try pattern matching
    const code = trackingNumber.replace(/\s/g, '');
    for (const pattern of patterns) {
      if (pattern.prefix.test(code)) {
        return pattern.carrier;
      }
    }

    return null;
  }

  private generateWhiteLabelCode(): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < 14; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return code;
  }
}
