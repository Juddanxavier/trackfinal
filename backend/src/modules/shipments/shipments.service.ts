import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { eq, and } from 'drizzle-orm';
import { UsersService } from '../users/services';
import { NotificationsService } from '../notifications/notifications.service';
import { Track17Service } from './track17.service';

@Injectable()
export class ShipmentsService {
  constructor(
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private track17Service: Track17Service,
  ) {}

  async create(data: {
    organisationId: string;
    userId?: string;
    assignedToId?: string;
    trackingNumber: string;
    carrierCode?: string;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    recipientAddress?: string;
    originCountry: string;
    destinationCountry: string;
    goodsType?: string;
    weight?: string;
  }) {
    if (!data.recipientEmail && !data.recipientPhone) {
      throw new BadRequestException('At least phone or email is required');
    }

    const whiteLabelCode = this.generateWhiteLabelCode();

    let finalUserId = data.userId || null;
    if (data.userId) {
      const user = await this.usersService.findById(data.userId);
      if (!user) {
        finalUserId = null;
      }
    }

    let carrierCode = data.carrierCode;
    if (!carrierCode) {
      const detection = await this.detectCarrier(data.trackingNumber);
      if (detection.detected && detection.carrierCode) {
        carrierCode = detection.carrierCode;
      }
    }

    const [shipment] = await db.insert(shipments).values({
      organisationId: data.organisationId,
      userId: finalUserId,
      assignedToId: data.assignedToId || null,
      trackingNumber: data.trackingNumber,
      whiteLabelTrackingCode: whiteLabelCode,
      carrierCode: carrierCode || 'unknown',
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail || null,
      recipientPhone: data.recipientPhone || null,
      recipientAddress: data.recipientAddress || null,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
      goodsType: data.goodsType || 'general',
      weight: data.weight || null,
      status: 'pending',
    } as any).returning();

    try {
      const trackData = await this.track17Service.track(carrierCode || 'unknown', data.trackingNumber);
      if (trackData) {
        await db.update(shipments).set({
          track17Data: trackData,
          updatedAt: new Date(),
        } as any).where(eq(shipments.id, shipment.id));
      }
    } catch (error) {
      console.error('Failed to fetch track17 data:', error);
    }

    if (finalUserId) {
      await this.notificationsService.create(data.organisationId, {
        userId: finalUserId,
        titleKey: 'shipment.created',
        data: {
          shipmentId: shipment.id,
          whiteLabelCode,
          trackingNumber: data.trackingNumber,
          carrierCode: carrierCode,
        },
      });
    }

    return this.findById(shipment.id);
  }

  async findById(id: string) {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async findByUser(userId: string) {
    return db.select().from(shipments).where(eq(shipments.userId, userId));
  }

  async findByOrganisation(organisationId: string) {
    return db.select().from(shipments).where(eq(shipments.organisationId, organisationId));
  }

  async findByWhiteLabelCode(code: string) {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.whiteLabelTrackingCode, code));
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async update(id: string, data: {
    assignedToId?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    recipientAddress?: string;
  }) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;
    if (data.recipientEmail !== undefined) updateData.recipientEmail = data.recipientEmail;
    if (data.recipientPhone !== undefined) updateData.recipientPhone = data.recipientPhone;
    if (data.recipientAddress !== undefined) updateData.recipientAddress = data.recipientAddress;

    await db.update(shipments).set(updateData as any).where(eq(shipments.id, id));
    return this.findById(id);
  }

  async refreshTrack17Data(id: string) {
    const shipment = await this.findById(id);
    const trackData = await this.track17Service.track(shipment.carrierCode, shipment.trackingNumber);
    if (trackData) {
      await db.update(shipments).set({
        track17Data: trackData,
        updatedAt: new Date(),
      } as any).where(eq(shipments.id, id));
    }
    return this.findById(id);
  }

  async processWebhookUpdate(carrierCode: string, trackingNumber: string, trackData: any) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(
        and(
          eq(shipments.carrierCode, carrierCode),
          eq(shipments.trackingNumber, trackingNumber),
        )
      );

    if (!shipment) {
      console.log(`[Webhook] Shipment not found for ${carrierCode}/${trackingNumber}`);
      return null;
    }

    await db.update(shipments).set({
      track17Data: trackData,
      updatedAt: new Date(),
    } as any).where(eq(shipments.id, shipment.id));

    return this.findById(shipment.id);
  }

  async detectCarrier(trackingNumber: string): Promise<{ detected: boolean; carrierCode?: string; trackData?: any }> {
    const result = await this.track17Service.detectCarrier(trackingNumber);

    if (!result || !result.data || result.data.length === 0) {
      return { detected: false };
    }

    const detected = result.data[0];
    if (detected.carrier) {
      const trackResult = await this.track17Service.track(detected.carrier, trackingNumber);
      return {
        detected: true,
        carrierCode: detected.carrier,
        trackData: trackResult,
      };
    }

    return { detected: false };
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