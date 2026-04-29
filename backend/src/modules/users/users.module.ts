import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import {
  UsersService,
  OrganisationsService,
  SessionsService,
} from './services';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [UsersController],
  providers: [UsersService, OrganisationsService, SessionsService],
  exports: [UsersService, OrganisationsService, SessionsService],
})
export class UsersModule {}
