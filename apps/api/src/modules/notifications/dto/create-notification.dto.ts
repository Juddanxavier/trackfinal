import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiPropertyOptional({
    description:
      'User ID to send notification to (admin/staff only, defaults to self)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Notification title key (e.g., "quote.assigned")',
  })
  @IsString()
  @IsNotEmpty()
  titleKey: string;

  @ApiPropertyOptional({ description: 'Template variables for notification' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
