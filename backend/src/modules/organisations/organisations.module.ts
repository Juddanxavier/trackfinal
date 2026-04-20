import { Module } from '@nestjs/common';
import { OrganisationsController } from './organisations.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [OrganisationsController],
})
export class OrganisationsModule {}