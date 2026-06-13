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
  NotFoundException,
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
import { CreateShipmentDto, UpdateShipmentDto } from './dto/shipments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasbinGuard, Require } from '../../common/casbin';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';
import { CarriersService } from '../carriers/carriers.service';
import { isAdminRole } from '../../common/enums/role.enum';
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
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'write' })
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
      const detected = await this.carriersService.detectByTrackingNumber(
        dto.trackingNumber,
      );
      carrierCode = detected?.key || 'unknown';
    }

    let branchId: string | null;
    if (req.user.role === Role.ADMIN) {
      if (!dto.branchId) {
        throw new BadRequestException(
          'Branch is required for admin-created shipments',
        );
      }
      branchId = dto.branchId;
    } else {
      branchId = dto.branchId || req.user.branchId || null;
    }

    return this.shipmentsService.create({
      organisationId,
      trackingNumber: dto.trackingNumber,
      carrierCode,
      recipientName: dto.recipientName,
      recipientEmail: dto.recipientEmail,
      recipientPhone: dto.recipientPhone,
      userId: req.user.id,
      assignedToId: dto.userId || null,
      branchId,
      billAmount: dto.billAmount ?? null,
    });
  }

  @Get()
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'read' })
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
    @Query('branchId') branchId?: string,
  ) {
    const orgId = organisationId || req.user.organisationId;
    if (!orgId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to view shipments.',
      );
    }
    if (req.user.organisationId && orgId !== req.user.organisationId) {
      throw new ForbiddenException(
        'You can only access shipments in your organisation',
      );
    }
    // Staff are restricted to their own branch; admins can override via query param
    const resolvedBranchId =
      req.user.role === 'staff' ? req.user.branchId : branchId || undefined;
    return this.shipmentsService.findAll({
      organisationId: orgId,
      branchId: resolvedBranchId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      status,
      archived: archived === 'true',
      deleted: deleted === 'true',
    });
  }

  @Get('my-shipments')
  @ApiOperation({ summary: "Get current user's shipments" })
  @ApiResponse({ status: 200, description: 'User shipments list' })
  async getMyShipments(@Request() req: any) {
    const userId = req.user.id;
    const role = req.user.role;
    const organisationId = req.user.organisationId;

    // ADMIN and STAFF see all organisation shipments
    if ((isAdminRole(role) || role === 'staff') && organisationId) {
      return this.shipmentsService.findByOrganisation(organisationId);
    }

    // CUSTOMER sees only their own shipments
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
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'write' })
  @ApiOperation({ summary: 'Create test shipment' })
  @ApiResponse({ status: 201, description: 'Test shipment created' })
  async createTest(@Request() req: any, @Body() dto: CreateShipmentDto) {
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lookup user by email or phone' })
  @ApiResponse({ status: 200, description: 'User info if found' })
  async lookupUser(
    @Request() req: any,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    return this.usersService.lookupUser(email, phone, req.user.organisationId);
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
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'read' })
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get shipment stats' })
  @ApiResponse({ status: 200, description: 'Shipment stats' })
  async getStats(
    @Request() req: any,
    @Query('organisationId') organisationId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const requestedOrgId = organisationId || req.user.organisationId;
    if (req.user.organisationId && requestedOrgId !== req.user.organisationId) {
      throw new ForbiddenException(
        'You can only access stats for your organisation',
      );
    }
    const resolvedBranchId =
      req.user.role === 'staff' ? req.user.branchId : branchId || undefined;
    return this.shipmentsService.getStats(requestedOrgId || '', resolvedBranchId);
  }

  @Get('activity')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'read' })
  @ApiOperation({ summary: 'Get shipment activity history' })
  @ApiResponse({ status: 200, description: 'Activity data' })
  async getActivity(
    @Request() req: any,
    @Query('organisationId') organisationId?: string,
    @Query('days') days?: string,
    @Query('branchId') branchId?: string,
  ) {
    const requestedOrgId = organisationId || req.user.organisationId;
    if (req.user.organisationId && requestedOrgId !== req.user.organisationId) {
      throw new ForbiddenException(
        'You can only access activity for your organisation',
      );
    }
    const resolvedBranchId =
      req.user.role === 'staff' ? req.user.branchId : branchId || undefined;
    return this.shipmentsService.getActivity(
      requestedOrgId || '',
      resolvedBranchId,
      days ? parseInt(days) : 30,
    );
  }

  @Get('destinations')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'read' })
  @ApiOperation({ summary: 'Get top destinations' })
  @ApiResponse({ status: 200, description: 'Destination data' })
  async getDestinations(
    @Request() req: any,
    @Query('organisationId') organisationId?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
  ) {
    const requestedOrgId = organisationId || req.user.organisationId;
    if (req.user.organisationId && requestedOrgId !== req.user.organisationId) {
      throw new ForbiddenException(
        'You can only access destinations for your organisation',
      );
    }
    const resolvedBranchId =
      req.user.role === 'staff' ? req.user.branchId : branchId || undefined;
    return this.shipmentsService.getDestinations(
      requestedOrgId || '',
      resolvedBranchId,
      limit ? parseInt(limit) : 6,
    );
  }

  @Get('user/:userId')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'read' })
  @ApiOperation({ summary: 'Get shipments by user ID' })
  @ApiResponse({ status: 200, description: 'User shipments list' })
  async findByUser(
    @Param('userId') userId: string,
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = req.user.organisationId;
    if (!orgId) {
      throw new BadRequestException('User must be assigned to an organisation');
    }
    const data = await this.shipmentsService.findByUserAndOrganisation(
      userId,
      orgId,
    );
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const total = data.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginated = data.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    return {
      data: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  @Get(':id')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'read' })
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiResponse({ status: 200, description: 'Shipment details' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const shipment = await this.shipmentsService.findOne(id);

    // Check organisation boundary
    if (
      req.user.organisationId &&
      shipment.organisationId !== req.user.organisationId
    ) {
      throw new ForbiddenException(
        'You can only access shipments in your organisation',
      );
    }

    return shipment;
  }

  @Patch(':id')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'write' })
  @ApiOperation({ summary: 'Update shipment recipient details' })
  @ApiResponse({ status: 200, description: 'Shipment updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDto,
    @Request() req: any,
  ) {
    const shipment = await this.shipmentsService.findOne(id);

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (
      req.user.role !== Role.SUPERADMIN &&
      shipment.organisationId !== req.user.organisationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Only admin can update bill amount; strip it for staff
    const updateData: any = { ...dto };
    if (!isAdminRole(req.user.role)) {
      delete updateData.billAmount;
    }

    return this.shipmentsService.update(id, updateData);
  }

  @Patch(':id/status')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'write' })
  @ApiOperation({ summary: 'Update shipment status' })
  @ApiResponse({ status: 200, description: 'Shipment status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: {
      status: string;
      location?: string;
      statusRaw?: string;
      description?: string;
    },
  ) {
    const shipment = await this.shipmentsService.findOne(id);

    if (
      req.user.organisationId &&
      shipment.organisationId !== req.user.organisationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return this.shipmentsService.updateStatus(id, body.status, {
      location: body.location,
      statusRaw: body.statusRaw,
      description: body.description,
    });
  }

  @Patch(':id/archive')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'write' })
  @ApiOperation({ summary: 'Archive shipment' })
  @ApiResponse({ status: 200, description: 'Shipment archived' })
  async archive(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== Role.SUPERADMIN && !req.user.organisationId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to archive shipments.',
      );
    }
    return this.shipmentsService.archive(id, req.user.organisationId);
  }

  @Patch(':id/unarchive')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'write' })
  @ApiOperation({ summary: 'Unarchive shipment' })
  @ApiResponse({ status: 200, description: 'Shipment unarchived' })
  async unarchive(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== Role.SUPERADMIN && !req.user.organisationId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to unarchive shipments.',
      );
    }
    return this.shipmentsService.unarchive(id, req.user.organisationId);
  }

  @Delete(':id')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'delete' })
  @ApiOperation({ summary: 'Soft delete shipment' })
  @ApiResponse({ status: 200, description: 'Shipment deleted' })
  async softDelete(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== Role.SUPERADMIN && !req.user.organisationId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to delete shipments.',
      );
    }
    return this.shipmentsService.softDelete(id, req.user.organisationId);
  }

  @Patch(':id/restore')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'write' })
  @ApiOperation({ summary: 'Restore soft-deleted shipment' })
  @ApiResponse({ status: 200, description: 'Shipment restored' })
  async restore(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== Role.SUPERADMIN && !req.user.organisationId) {
      throw new BadRequestException(
        'User must be assigned to an organisation to restore shipments.',
      );
    }
    return this.shipmentsService.restore(id, req.user.organisationId);
  }
}
