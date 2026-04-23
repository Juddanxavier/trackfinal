import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { Track17WebhookController } from './track17.webhook.controller';
import { ShipmentsService } from './shipments.service';
import { Track17Service } from './track17.service';
import { CarrierService } from './carrier.service';
import { ShipmentsTrackingCron } from './shipments-tracking.cron';
import { TrackingProviderFactory } from './tracking.factory';
import { Track17Provider } from './providers/track17.provider';
import { TrackingMoreProvider } from './providers/tracking-more.provider';
import { ShippoProvider } from './providers/shippo.provider';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [UsersModule, NotificationsModule],
  controllers: [ShipmentsController, Track17WebhookController],
  providers: [
    ShipmentsService,
    Track17Service,
    CarrierService,
    ShipmentsTrackingCron,
    TrackingProviderFactory,
    Track17Provider,
    TrackingMoreProvider,
    ShippoProvider,
  ],
  exports: [ShipmentsService, CarrierService],
})
export class ShipmentsModule {}