import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inTransitNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveredNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  exceptionsNotifications?: boolean;
}

export class NotificationPreferencesResponseDto {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  inTransitNotifications: boolean;
  deliveredNotifications: boolean;
  exceptionsNotifications: boolean;
}
