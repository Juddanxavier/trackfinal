import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SeventeenTrackService } from './seventeen-track.service';
import { TrackingSyncService } from './tracking-sync.service';
import { TrackingController } from './tracking.controller';
import { SeventeenTrackWebhookController } from './seventeen-track-webhook.controller';
import { ShipmentsModule } from '../shipments/shipments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    forwardRef(() => ShipmentsModule),
    NotificationsModule,
  ],
  controllers: [SeventeenTrackWebhookController, TrackingController],
  providers: [SeventeenTrackService, TrackingSyncService],
  exports: [SeventeenTrackService, TrackingSyncService],
})
export class TrackingModule {}
