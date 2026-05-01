import { Module } from '@nestjs/common';
import { TestNotificationsController } from './test-notifications.controller';

@Module({
  controllers: [TestNotificationsController],
})
export class TestNotificationsModule {}
