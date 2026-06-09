import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SeventeenTrackService } from './seventeen-track.service';
import { TrackingSyncService } from './tracking-sync.service';
import { TrackingController } from './tracking.controller';
import { SeventeenTrackWebhookController } from './seventeen-track-webhook.controller';
import { TrackingRateLimiter } from './tracking-rate-limiter';
import { TrackingWebhookService } from './tracking-webhook.service';
import { TrackingCarrierService } from './tracking-carrier.service';
import { TrackingParserService } from './tracking-parser.service';
import { ShipmentsModule } from '../shipments/shipments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    forwardRef(() => ShipmentsModule),
    NotificationsModule,
    WebhooksModule,
  ],
  controllers: [SeventeenTrackWebhookController, TrackingController],
  providers: [
    SeventeenTrackService,
    TrackingSyncService,
    TrackingRateLimiter,
    TrackingWebhookService,
    TrackingCarrierService,
    TrackingParserService,
  ],
  exports: [
    SeventeenTrackService,
    TrackingSyncService,
    TrackingRateLimiter,
    TrackingWebhookService,
    TrackingCarrierService,
    TrackingParserService,
  ],
})
export class TrackingModule {}
