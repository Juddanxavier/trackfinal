import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from './notifications.module';
import { TestNotificationsController } from './test-notifications.controller';

@Module({})
export class TestNotificationsModule {
  static register() {
    if (process.env.NODE_ENV === 'production') {
      return {
        module: TestNotificationsModule,
        controllers: [],
      };
    }
    return {
      module: TestNotificationsModule,
      imports: [forwardRef(() => NotificationsModule)],
      controllers: [TestNotificationsController],
    };
  }
}
