import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  titleKey: string; // e.g., "quote.assigned"

  @IsOptional()
  @IsObject()
  data?: Record<string, any>; // Template variables
}
