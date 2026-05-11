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
  BadRequestException,
  ForbiddenException,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '../../common/interceptors/cache.interceptor';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/shipments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';
import { CarriersService } from '../carriers/carriers.service';
import { UsersService } from '../users/services';

@ApiTags('Shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly carriersService: CarriersService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create new shipment' })
  @ApiResponse({ status: 201, description: 'Shipment created' })
  async create(@Body() dto: CreateShipmentDto, @Request() req: any) {
    // Determine organisation ID: use DTO if provided (for admins), otherwise use user's org
    const organisationId = dto.organisationId || req.user.organisationId;
    
    if (!organisationId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to create shipments. Please contact an administrator.',
      );
    }
    
    let carrierCode = dto.carrierCode;
    if (!carrierCode) {
      const detected = await this.carriersService.detectByTrackingNumber(dto.trackingNumber);
      carrierCode = detected?.key || 'unknown';
    }
    
    return this.shipmentsService.create({
      organisationId,
      trackingNumber: dto.trackingNumber,
      carrierCode,
      recipientName: dto.recipientName,
      recipientEmail: dto.recipientEmail,
      recipientPhone: dto.recipientPhone,
      userId: dto.userId,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'List shipments' })
  @ApiResponse({ status: 200, description: 'Shipments list' })
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('archived') archived?: string,
    @Query('deleted') deleted?: string,
    @Query('organisationId') organisationId?: string,
  ) {
    const orgId = organisationId || req.user.organisationId;
    if (!orgId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to view shipments.',
      );
    }
    return this.shipmentsService.findAll({
      organisationId: orgId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      status,
      archived: archived === 'true',
      deleted: deleted === 'true',
    });
  }

  @Get('my-shipments')
  @ApiOperation({ summary: 'Get current user\'s shipments' })
  @ApiResponse({ status: 200, description: 'User shipments list' })
  async getMyShipments(@Request() req: any) {
    const userId = req.user.sub;
    return this.shipmentsService.findByUserId(userId);
  }

  @Get('carriers')
  @Public()
  @ApiOperation({ summary: 'List all carriers' })
  @ApiResponse({ status: 200, description: 'Carriers list' })
  async getCarriers() {
    return this.carriersService.getAllCarriers();
  }

  @Post('test-create')
  @Public()
  @ApiOperation({ summary: 'Create test shipment (no auth)' })
  @ApiResponse({ status: 201, description: 'Test shipment created' })
  async createTest(@Body() dto: CreateShipmentDto) {
    const testOrgId = '00000000-0000-0000-0000-000000000001';
    return this.shipmentsService.create({
      organisationId: testOrgId,
      trackingNumber: dto.trackingNumber,
      carrierCode: dto.carrierCode || 'dhl',
      recipientName: dto.recipientName,
      recipientEmail: dto.recipientEmail,
      recipientPhone: dto.recipientPhone,
      userId: dto.userId,
    });
  }

  @Get('detect-carrier')
  @Public()
  @ApiOperation({ summary: 'Detect carrier from tracking number' })
  @ApiResponse({ status: 200, description: 'Carrier detection result' })
  async detectCarrier(@Query('trackingNumber') trackingNumber: string) {
    const carrier =
      await this.carriersService.detectByTrackingNumber(trackingNumber);
    if (carrier) {
      return {
        detected: true,
        carrierCode: carrier.key,
        carrierName: carrier.name_en,
      };
    }
    return {
      detected: false,
      carrierCode: null,
      carrierName: null,
    };
  }

  @Get('lookup-user')
  @Public()
  @ApiOperation({ summary: 'Lookup user by email or phone' })
  @ApiResponse({ status: 200, description: 'User info if found' })
  async lookupUser(
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    return this.usersService.lookupUser(email, phone);
  }

  @Get('public/track/:code')
  @Public()
  @ApiOperation({ summary: 'Track shipment by white label code' })
  @ApiResponse({ status: 200, description: 'Shipment tracking info' })
  async findByWhiteLabelCode(@Param('code') code: string) {
    return this.shipmentsService.findByWhiteLabelCode(code);
  }

  @Get('public/:code')
  @Public()
  @ApiOperation({ summary: 'Get shipment by tracking number' })
  @ApiResponse({ status: 200, description: 'Shipment details' })
  async findByTrackingNumber(@Param('code') code: string) {
    return this.shipmentsService.findByTrackingNumber(code);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get shipment stats' })
  @ApiResponse({ status: 200, description: 'Shipment stats' })
  async getStats(
    @Request() req: any,
    @Query('organisationId') organisationId?: string,
  ) {
    // Users can only access their own organisation's stats
    // Admins without org can access any (for system-wide stats)
    const requestedOrgId = organisationId || req.user.organisationId;
    if (req.user.organisationId && requestedOrgId !== req.user.organisationId) {
      throw new ForbiddenException('You can only access stats for your organisation');
    }
    return this.shipmentsService.getStats(requestedOrgId || '');
  }

  @Get('activity')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get shipment activity history' })
  @ApiResponse({ status: 200, description: 'Activity data' })
  async getActivity(
    @Request() req: any,
    @Query('organisationId') organisationId?: string,
    @Query('days') days?: string,
  ) {
    // Users can only access their own organisation's activity
    const requestedOrgId = organisationId || req.user.organisationId;
    if (req.user.organisationId && requestedOrgId !== req.user.organisationId) {
      throw new ForbiddenException('You can only access activity for your organisation');
    }
    return this.shipmentsService.getActivity(
      requestedOrgId || '',
      days ? parseInt(days) : 30,
    );
  }

  @Get('destinations')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get top destinations' })
  @ApiResponse({ status: 200, description: 'Destination data' })
  async getDestinations(
    @Request() req: any,
    @Query('organisationId') organisationId?: string,
    @Query('limit') limit?: string,
  ) {
    // Users can only access their own organisation's destinations
    const requestedOrgId = organisationId || req.user.organisationId;
    if (req.user.organisationId && requestedOrgId !== req.user.organisationId) {
      throw new ForbiddenException('You can only access destinations for your organisation');
    }
    return this.shipmentsService.getDestinations(
      requestedOrgId || '',
      limit ? parseInt(limit) : 6,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiResponse({ status: 200, description: 'Shipment details' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const shipment = await this.shipmentsService.findOne(id);
    
    // Check organisation boundary
    if (req.user.organisationId && shipment.organisationId !== req.user.organisationId) {
      throw new ForbiddenException('You can only access shipments in your organisation');
    }
    
    return shipment;
  }

  @Patch(':id/status')
  @Public()
  @ApiOperation({ summary: 'Update shipment status' })
  @ApiResponse({ status: 200, description: 'Shipment status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: string;
      location?: string;
      statusRaw?: string;
      description?: string;
    },
  ) {
    return this.shipmentsService.updateStatus(id, body.status, {
      location: body.location,
      statusRaw: body.statusRaw,
      description: body.description,
    });
  }

  @Patch(':id/archive')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Archive shipment' })
  @ApiResponse({ status: 200, description: 'Shipment archived' })
  async archive(@Param('id') id: string, @Request() req: any) {
    if (!req.user.organisationId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to archive shipments.',
      );
    }
    return this.shipmentsService.archive(id, req.user.organisationId);
  }

  @Patch(':id/unarchive')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Unarchive shipment' })
  @ApiResponse({ status: 200, description: 'Shipment unarchived' })
  async unarchive(@Param('id') id: string, @Request() req: any) {
    if (!req.user.organisationId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to unarchive shipments.',
      );
    }
    return this.shipmentsService.unarchive(id, req.user.organisationId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Soft delete shipment' })
  @ApiResponse({ status: 200, description: 'Shipment deleted' })
  async softDelete(@Param('id') id: string, @Request() req: any) {
    if (!req.user.organisationId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to delete shipments.',
      );
    }
    return this.shipmentsService.softDelete(id, req.user.organisationId);
  }

  @Patch(':id/restore')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Restore soft-deleted shipment' })
  @ApiResponse({ status: 200, description: 'Shipment restored' })
  async restore(@Param('id') id: string, @Request() req: any) {
    if (!req.user.organisationId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to restore shipments.',
      );
    }
    return this.shipmentsService.restore(id, req.user.organisationId);
  }
}
