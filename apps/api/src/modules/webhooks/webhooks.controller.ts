import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasbinGuard, Require } from '../../common/casbin';
import { Role } from '../../common/enums/role.enum';
import { WebhooksService, WebhookEvent } from './webhooks.service';

interface AuthUser {
  sub: string;
  role: string;
  organisationId: string | null;
}

interface AuthRequest {
  user: AuthUser;
}

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard, CasbinGuard)
@Require({ resource: 'webhooks', action: 'read' })
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List webhook endpoints' })
  async getEndpoints(
    @Request() req: AuthRequest,
    @Query('organisationId') organisationId?: string,
  ) {
    const orgId = organisationId || req.user.organisationId;
    if (!orgId) {
      if (req.user.role === Role.SUPERADMIN) {
        return [];
      }
      return [];
    }
    return this.webhooksService.getEndpoints(orgId);
  }

  @Post()
  @Require({ resource: 'webhooks', action: 'write' })
  @ApiOperation({ summary: 'Create a webhook endpoint' })
  async createEndpoint(
    @Request() req: AuthRequest,
    @Body() body: { url: string; events: string[]; organisationId?: string },
  ) {
    const orgId = body.organisationId || req.user.organisationId;
    if (!orgId) {
      return { error: 'Organisation ID is required' };
    }
    return this.webhooksService.createEndpoint(orgId, body);
  }

  @Patch(':id')
  @Require({ resource: 'webhooks', action: 'write' })
  @ApiOperation({ summary: 'Update a webhook endpoint' })
  async updateEndpoint(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { url?: string; events?: string[]; isActive?: boolean },
  ) {
    const orgId = req.user.organisationId || undefined;
    return this.webhooksService.updateEndpoint(id, orgId, body);
  }

  @Delete(':id')
  @Require({ resource: 'webhooks', action: 'write' })
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  async deleteEndpoint(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const orgId = req.user.organisationId || undefined;
    await this.webhooksService.deleteEndpoint(id, orgId);
    return { success: true };
  }

  @Get(':id/logs')
  @Require({ resource: 'webhooks', action: 'read' })
  @ApiOperation({ summary: 'Get delivery logs for an endpoint' })
  async getLogs(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = req.user.organisationId || undefined;
    return this.webhooksService.getDeliveryLogs(
      id,
      orgId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('events')
  @ApiOperation({ summary: 'List available webhook events' })
  async getEvents() {
    return this.webhooksService.getAvailableEvents();
  }
}
