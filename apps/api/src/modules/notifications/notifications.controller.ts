import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { NotificationsService } from './notifications.service';
import { UsersService } from '../users/services';
import { CreateNotificationDto, QueryNotificationsDto } from './dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create a new notification (admin/staff only)' })
  @ApiResponse({
    status: 201,
    description: 'Notification created and WebSocket event emitted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin/staff only' })
  async create(@Request() req: any, @Body() dto: CreateNotificationDto) {
    const targetUserId = dto.userId || req.user.id;

    if (dto.userId && dto.userId !== req.user.id) {
      const targetUser = await this.usersService.findById(dto.userId);
      if (!targetUser) {
        throw new ForbiddenException('Target user not found');
      }
      if (targetUser.organisationId !== req.user.organisationId) {
        throw new ForbiddenException(
          'Cannot send notifications to users outside your organisation',
        );
      }
    }

    return this.notificationsService.create(req.user.organisationId, {
      ...dto,
      userId: targetUserId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req: any, @Query() query: QueryNotificationsDto) {
    return this.notificationsService.findAll(
      req.user.organisationId,
      req.user.id,
      query,
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(
      id,
      req.user.organisationId,
      req.user.id,
    );
  }

  @Patch(':id/unread')
  @ApiOperation({ summary: 'Mark notification as unread' })
  @ApiResponse({ status: 200, description: 'Notification marked as unread' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markUnread(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markUnread(
      id,
      req.user.organisationId,
      req.user.id,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(
      req.user.organisationId,
      req.user.id,
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(
      req.user.organisationId,
      req.user.id,
    );
  }
}
