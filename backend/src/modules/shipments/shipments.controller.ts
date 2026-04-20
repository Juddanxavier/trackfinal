import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiHeader, ApiBody } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { CarrierService, Carrier } from './carrier.service';
import { CreateShipmentDto, UpdateShipmentDto } from './dto/shipments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly carrierService: CarrierService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create shipment', description: 'Creates a new shipment. Carrier is auto-detected if not provided.' })
  @ApiResponse({ status: 201, description: 'Shipment created with white label tracking code' })
  @ApiResponse({ status: 400, description: 'At least phone or email is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  async create(@Body() createDto: CreateShipmentDto, @Request() req: any) {
    return this.shipmentsService.create({
      organisationId: req.user.organisationId,
      userId: createDto.userId,
      assignedToId: createDto.assignedToId,
      trackingNumber: createDto.trackingNumber,
      carrierCode: createDto.carrierCode,
      recipientName: createDto.recipientName,
      recipientEmail: createDto.recipientEmail,
      recipientPhone: createDto.recipientPhone,
      recipientAddress: createDto.recipientAddress,
      originCountry: createDto.originCountry,
      destinationCountry: createDto.destinationCountry,
      goodsType: createDto.goodsType,
      weight: createDto.weight,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all shipments', description: 'List all shipments for the organisation' })
  @ApiResponse({ status: 200, description: 'List of organisation shipments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  async findAll(@Request() req: any) {
    return this.shipmentsService.findByOrganisation(req.user.organisationId);
  }

  @Public()
  @Get('public/track/:code')
  @ApiOperation({ summary: 'Track shipment (public)', description: 'Public endpoint to track shipment by white label code' })
  @ApiParam({ name: 'code', description: '14-digit white label tracking code' })
  @ApiResponse({ status: 200, description: 'Shipment tracking info' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async trackByCode(@Param('code') code: string) {
    return this.shipmentsService.findByWhiteLabelCode(code);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  @ApiResponse({ status: 200, description: 'Shipment details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async findOne(@Param('id') id: string) {
    return this.shipmentsService.findById(id);
  }

  @Get('customer/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get shipments by customer ID', description: 'List all shipments for a specific customer' })
  @ApiParam({ name: 'userId', description: 'Customer user UUID' })
  @ApiResponse({ status: 200, description: 'List of customer shipments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  async findByCustomer(@Param('userId') userId: string) {
    return this.shipmentsService.findByUser(userId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update shipment', description: 'Update shipment contact info or assignment' })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  @ApiResponse({ status: 200, description: 'Shipment updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateShipmentDto) {
    return this.shipmentsService.update(id, {
      assignedToId: updateDto.assignedToId,
      recipientEmail: updateDto.recipientEmail,
      recipientPhone: updateDto.recipientPhone,
      recipientAddress: updateDto.recipientAddress,
    });
  }

  @Post(':id/refresh-tracking')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Refresh tracking data', description: 'Fetch latest tracking info from Track17 API' })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  @ApiResponse({ status: 200, description: 'Updated with latest tracking data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async refreshTracking(@Param('id') id: string) {
    return this.shipmentsService.refreshTrack17Data(id);
  }

  @Post('detect-carrier')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Detect carrier', description: 'Auto-detect carrier from tracking number using Track17 API' })
  @ApiBody({ schema: { type: 'object', properties: { trackingNumber: { type: 'string', example: '1234567890' } } } })
  @ApiResponse({ status: 200, description: 'Carrier detection result', schema: { properties: { detected: { type: 'boolean' }, carrierCode: { type: 'string' }, trackData: { type: 'object' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  async detectCarrier(@Body() body: { trackingNumber: string }) {
    return this.shipmentsService.detectCarrier(body.trackingNumber);
  }

  @Get('carriers')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'List carriers', description: 'Get list of supported carriers. Optional: filter by country ISO code.' })
  @ApiParam({ name: 'country', required: false, description: 'Filter by country ISO code (e.g., US, GB, DE)' })
  @ApiResponse({ status: 200, description: 'List of carriers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  async listCarriers(@Query('country') country?: string) {
    return this.carrierService.listCarriers(country);
  }

  @Get('carriers/search')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Search carriers', description: 'Search carriers by name or code' })
  @ApiParam({ name: 'q', description: 'Search query (name or key)' })
  @ApiResponse({ status: 200, description: 'List of matching carriers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  async searchCarriers(@Query('q') query: string) {
    return this.carrierService.searchCarriers(query);
  }
}