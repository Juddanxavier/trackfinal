import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';

@Controller('notifications')
export class NotificationPreferencesController {
  constructor(private preferencesService: NotificationPreferencesService) {}

  @Get('preferences')
  async getPreferences(@Request() req: any) {
    const userId = req.user.id;
    const organisationId = req.user.organisationId;

    const prefs = await this.preferencesService.getPreferences(
      organisationId,
      userId,
    );
    return {
      emailEnabled: prefs.emailEnabled,
      whatsappEnabled: prefs.whatsappEnabled,
      inTransitNotifications: prefs.inTransitNotifications,
      deliveredNotifications: prefs.deliveredNotifications,
    };
  }

  @Patch('preferences')
  async updatePreferences(
    @Request() req: any,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const userId = req.user.id;
    const organisationId = req.user.organisationId;

    return this.preferencesService.updatePreferences(
      organisationId,
      userId,
      dto,
    );
  }
}
