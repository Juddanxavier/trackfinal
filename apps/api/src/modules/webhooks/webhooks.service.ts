import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { db } from '../../database';
import {
  webhookEndpoints,
  webhookDeliveryLogs,
} from '../../database/schema/webhooks';
import { eq, and, inArray } from 'drizzle-orm';
import * as crypto from 'crypto';

const WEBHOOK_EVENTS = ['in_transit', 'delivered', 'exception', 'cancelled'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectQueue('webhook-deliveries')
    private webhookQueue: Queue,
  ) {}

  async getEndpoints(organisationId: string) {
    return db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.organisationId, organisationId))
      .orderBy(webhookEndpoints.createdAt);
  }

  async createEndpoint(
    organisationId: string,
    data: { url: string; events: string[] },
  ) {
    for (const event of data.events) {
      if (!WEBHOOK_EVENTS.includes(event as WebhookEvent)) {
        throw new BadRequestException(`Invalid event: ${event}`);
      }
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const [endpoint] = await db
      .insert(webhookEndpoints)
      .values({
        organisationId,
        url: data.url,
        secret,
        events: data.events,
      })
      .returning();

    this.logger.log(`Webhook endpoint created: ${endpoint.id}`);
    return endpoint;
  }

  async updateEndpoint(
    id: string,
    organisationId: string,
    data: { url?: string; events?: string[]; isActive?: boolean },
  ) {
    const [existing] = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.organisationId, organisationId),
        ),
      );

    if (!existing) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    if (data.events) {
      for (const event of data.events) {
        if (!WEBHOOK_EVENTS.includes(event as WebhookEvent)) {
          throw new BadRequestException(`Invalid event: ${event}`);
        }
      }
    }

    const [updated] = await db
      .update(webhookEndpoints)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(webhookEndpoints.id, id))
      .returning();

    return updated;
  }

  async deleteEndpoint(id: string, organisationId: string) {
    const [existing] = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.organisationId, organisationId),
        ),
      );

    if (!existing) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    await db
      .delete(webhookEndpoints)
      .where(eq(webhookEndpoints.id, id));
  }

  async dispatch(event: WebhookEvent, payload: object, organisationId: string) {
    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.organisationId, organisationId),
          eq(webhookEndpoints.isActive, true),
        ),
      );

    const matching = endpoints.filter((ep) => ep.events.includes(event));

    for (const ep of matching) {
      const signature = crypto
        .createHmac('sha256', ep.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const [log] = await db
        .insert(webhookDeliveryLogs)
        .values({
          endpointId: ep.id,
          event,
          payload: payload as Record<string, unknown>,
          attempt: 1,
          maxAttempts: 3,
        })
        .returning();

      await db
        .update(webhookEndpoints)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(webhookEndpoints.id, ep.id));

      await this.webhookQueue.add(
        'deliver',
        {
          deliveryLogId: log.id,
          url: ep.url,
          secret: ep.secret,
          signature,
          payload,
          event,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 60000 },
        },
      );
    }
  }

  async getDeliveryLogs(
    endpointId: string,
    organisationId: string,
    limit = 50,
  ) {
    const [endpoint] = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, endpointId),
          eq(webhookEndpoints.organisationId, organisationId),
        ),
      );

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    return db
      .select()
      .from(webhookDeliveryLogs)
      .where(eq(webhookDeliveryLogs.endpointId, endpointId))
      .orderBy(webhookDeliveryLogs.createdAt)
      .limit(limit);
  }

  async getAvailableEvents(): Promise<string[]> {
    return [...WEBHOOK_EVENTS];
  }
}
