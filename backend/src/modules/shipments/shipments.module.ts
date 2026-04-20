import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { Track17WebhookController } from './track17.webhook.controller';
import { ShipmentsService } from './shipments.service';
import { Track17Service } from './track17.service';
import { CarrierService } from './carrier.service';
import { ShipmentsTrackingCron } from './shipments-tracking.cron';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [UsersModule, NotificationsModule],
  controllers: [ShipmentsController, Track17WebhookController],
  providers: [ShipmentsService, Track17Service, CarrierService, ShipmentsTrackingCron],
  exports: [ShipmentsService, CarrierService],
})
export class ShipmentsModule {}