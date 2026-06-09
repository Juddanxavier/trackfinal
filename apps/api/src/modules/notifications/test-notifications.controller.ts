import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { organisations } from '../../database/schema/organisations';
import { users } from '../../database/schema/user';
import { sql } from 'drizzle-orm';
import { EmailService } from '../auth/email.service';

@Controller('test-notifications')
@UseGuards(JwtAuthGuard)
export class TestNotificationsController {
  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
    private emailService: EmailService,
  ) {}

  @Get('config')
  getNotificationConfig() {
    return {
      NOTIFY_ON_IN_TRANSIT: this.configService.get('NOTIFY_ON_IN_TRANSIT'),
      NOTIFY_ON_DELIVERED: this.configService.get('NOTIFY_ON_DELIVERED'),
      NOTIFY_ON_CANCELLED: this.configService.get('NOTIFY_ON_CANCELLED'),
      NOTIFY_ON_EXCEPTION: this.configService.get('NOTIFY_ON_EXCEPTION'),
      NOTIFICATION_EMAIL_ENABLED: this.configService.get(
        'NOTIFICATION_EMAIL_ENABLED',
      ),
      NOTIFICATION_WHATSAPP_ENABLED: this.configService.get(
        'NOTIFICATION_WHATSAPP_ENABLED',
      ),
      NOTIFICATION_INAPP_ENABLED: this.configService.get(
        'NOTIFICATION_INAPP_ENABLED',
      ),
    };
  }

  @Post('shipment')
  async createTestShipment(
    @Body() body: { email?: string; phone?: string; status?: string },
  ) {
    const email = body.email || 'test@example.com';
    const phone = body.phone || '+1234567890';
    const status = body.status || 'pending';

    const [shipment] = await db
      .insert(shipments)
      .values({
        organisationId: sql`${sql.raw(`(SELECT id FROM organisations LIMIT 1)`)}`,
        userId: sql`${sql.raw(`(SELECT id FROM users LIMIT 1)`)}`,
        trackingNumber: `TEST${Date.now()}`,
        carrierCode: 'dhl',
        recipientName: 'Test Recipient',
        recipientEmail: email,
        recipientPhone: phone,
        originCountry: 'US',
        destinationCountry: 'UK',
        status: status as any,
      })
      .returning();

    return {
      message: 'Test shipment created',
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        recipientEmail: shipment.recipientEmail,
        recipientPhone: shipment.recipientPhone,
      },
    };
  }

  @Get('send')
  async testSendNotification(
    @Query('status') status: string = 'delivered',
    @Query('email') email: string = 'test@example.com',
    @Query('phone') phone: string = '+1234567890',
  ) {
    const titleKey = `shipment.${status}`;

    const [org] = await db
      .select({ id: organisations.id })
      .from(organisations)
      .limit(1);
    const [user] = await db.select({ id: users.id }).from(users).limit(1);

    const result = await this.notificationService.sendToAll({
      organisationId: org?.id || '00000000-0000-0000-0000-000000000000',
      userId: user?.id || '00000000-0000-0000-0000-000000000001',
      recipientEmail: email,
      recipientPhone: phone,
      titleKey,
      data: {
        trackingNumber: 'TEST123456789',
        carrierCode: 'dhl',
        status,
        recipientName: 'Test User',
        destinationCountry: 'United States',
        whiteLabelCode: 'TEST123',
        location: 'Test Location',
      },
    });

    return {
      titleKey,
      status,
      email,
      phone,
      organisationId: org?.id,
      userId: user?.id,
      result,
    };
  }

  @Get('email')
  async testDirectEmail(@Query('to') to: string = 'test@mailhog.com') {
    try {
      await this.emailService.sendEmail({
        to,
        subject: 'Test direct email',
        html: '<h1>Direct Email Test</h1><p>This is a direct test without BullMQ.</p>',
      });
      return { success: true, message: 'Email sent directly' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
