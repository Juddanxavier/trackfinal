import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';
import { TrackingSyncService } from './tracking-sync.service';
import { SeventeenTrackService } from './seventeen-track.service';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { eq } from 'drizzle-orm';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(
    private configService: ConfigService,
    private trackingSyncService: TrackingSyncService,
    private seventeenTrackService: SeventeenTrackService,
  ) {}

  @Post('sync/:shipmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync single shipment from 17TRACK' })
  async syncShipment(@Param('shipmentId') shipmentId: string) {
    return this.trackingSyncService.triggerManualSync(shipmentId);
  }

  @Post('sync-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync all active shipments' })
  async syncAllShipments() {
    return this.trackingSyncService.triggerSyncAll();
  }

  @Post('register/:shipmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register shipment with 17TRACK' })
  async registerShipment(@Param('shipmentId') shipmentId: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));

    if (!shipment) {
      return { success: false, message: 'Shipment not found' };
    }

    try {
      const result = await this.trackingSyncService.registerShipment(shipment);
      return result;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tracking settings' })
  async getSettings(@Query('organisationId') organisationId?: string) {
    const settings =
      await this.seventeenTrackService.getSettings(organisationId);
    return (
      settings || {
        webhookEnabled: true,
        pollingEnabled: true,
        pollingIntervalMinutes: 60,
        retryAttempts: 3,
        retryDelaySeconds: 60,
      }
    );
  }

  @Get('quota')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 17TRACK API quota' })
  async getQuota() {
    return this.seventeenTrackService.getquota();
  }

  @Get('status/:trackingNumber')
  @Public()
  @ApiOperation({ summary: 'Get tracking status without auth' })
  async getTrackingStatus(@Param('trackingNumber') trackingNumber: string) {
    const tracking =
      await this.seventeenTrackService.getTracking(trackingNumber);
    if (!tracking) {
      return { found: false, status: 'not_found' };
    }
    return {
      found: true,
      trackingNumber: tracking.trackingNumber,
      status: tracking.status,
      statusRaw: tracking.statusRaw,
      lastEvent: tracking.lastEvent,
      lastLocation: tracking.lastLocation,
      lastEventTime: tracking.lastEventTime,
      originCountry: tracking.originCountry,
      destinationCountry: tracking.destinationCountry,
      events: tracking.events.slice(0, 10),
    };
  }

  @Post('changeinfo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update tracking info (tag, email, phone) on 17TRACK',
  })
  async changeInfo(
    @Body()
    body: Array<{
      number: string;
      carrier: number;
      tag?: string;
      email?: string;
      phone?: string;
      lang?: string;
    }>,
  ) {
    if (!body || body.length === 0) {
      return { accepted: [], rejected: [] };
    }
    return this.seventeenTrackService.changeInfo(body);
  }

  @Post('stoptrack')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop tracking on 17TRACK' })
  async stopTrack(@Body() body: Array<{ number: string; carrier: number }>) {
    if (!body || body.length === 0) {
      return { accepted: [], rejected: [] };
    }
    return this.seventeenTrackService.stopTrack(body);
  }

  @Post('retrack')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Re-track on 17TRACK' })
  async retrans(@Body() body: Array<{ number: string; carrier: number }>) {
    if (!body || body.length === 0) {
      return { accepted: [], rejected: [] };
    }
    return this.seventeenTrackService.retrans(body);
  }

  @Post('changecarrier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change carrier on 17TRACK (max 5 per tracking)' })
  async changeCarrier(
    @Body()
    body: Array<{ number: string; carrier_old: number; carrier_new: number }>,
  ) {
    if (!body || body.length === 0) {
      return { accepted: [], rejected: [] };
    }
    return this.seventeenTrackService.changeCarrier(body);
  }

  @Get('changecarrier/:trackingNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get remaining carrier change attempts' })
  async getChangeCarrierAttempts(
    @Param('trackingNumber') trackingNumber: string,
  ) {
    return this.seventeenTrackService.getChangeCarrierAttempts(trackingNumber);
  }
}
