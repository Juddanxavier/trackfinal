import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { db } from '../../database';
import { webhookDeliveryLogs } from '../../database/schema/webhooks';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

interface DeliverJobData {
  deliveryLogId: string;
  url: string;
  secret: string;
  signature: string;
  payload: object;
  event: string;
}

@Processor('webhook-deliveries')
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  async process(job: Job<DeliverJobData>): Promise<void> {
    const { deliveryLogId, url, signature, payload } = job.data;

    try {
      const body = JSON.stringify(payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': job.data.event,
          'User-Agent': 'Track-Webhook/1.0',
        },
        body,
        signal: AbortSignal.timeout(15000),
      });

      const responseBody = await response.text().catch(() => '');

      await db
        .update(webhookDeliveryLogs)
        .set({
          status: response.ok ? 'success' : 'failed',
          statusCode: response.status,
          responseBody: responseBody.slice(0, 1000),
          completedAt: response.ok ? new Date() : undefined,
          nextRetryAt: response.ok
            ? undefined
            : this.getNextRetry(job.attemptsMade),
        })
        .where(eq(webhookDeliveryLogs.id, deliveryLogId));

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${responseBody.slice(0, 200)}`,
        );
      }

      this.logger.log(`Webhook delivered to ${url} (${response.status})`);
    } catch (error) {
      this.logger.warn(`Webhook delivery failed for ${url}: ${error.message}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Webhook job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Webhook job ${job.id} failed: ${error.message}`);

    db.update(webhookDeliveryLogs)
      .set({
        status: 'failed',
        responseBody: error.message.slice(0, 1000),
      })
      .where(
        eq(webhookDeliveryLogs.id, (job.data as DeliverJobData).deliveryLogId),
      )
      .catch(() => {});
  }

  private getNextRetry(attemptsMade: number): Date {
    const delays = [60000, 300000, 900000];
    const delay = delays[attemptsMade - 1] || 1800000;
    return new Date(Date.now() + delay);
  }
}
