import { Module, forwardRef } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { CarriersModule } from '../carriers/carriers.module';
import { UsersModule } from '../users/users.module';
import { TrackingModule } from '../tracking/tracking.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    CarriersModule,
    UsersModule,
    forwardRef(() => TrackingModule),
    NotificationsModule,
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
