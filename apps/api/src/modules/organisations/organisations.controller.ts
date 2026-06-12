import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrganisationsService } from '../users/services';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasbinGuard, Require } from '../../common/casbin';
import { Role, isAdminRole } from '../../common/enums/role.enum';

@ApiTags('organisations')
@Controller('organisations')
export class OrganisationsController {
  private readonly logger = new Logger(OrganisationsController.name);

  constructor(private readonly organisationsService: OrganisationsService) {}

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'organisations', action: 'write' })
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new organisation' })
  @ApiResponse({ status: 201, description: 'Organisation created' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin only' })
  create(
    @Body()
    createDto: {
      name: string;
      slug: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      countryCode?: string;
      currency?: string;
      logoUrl?: string;
    },
    @Request() req: any,
  ) {
    if (req.user.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can create organisations');
    }
    return this.organisationsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all organisations' })
  @ApiResponse({ status: 200, description: 'List of organisations' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findAll(@Request() req: any) {
    const orgId = req.user.organisationId;
    const role = req.user.role;
    this.logger.log('findAll orgId: ' + orgId + ', role: ' + role);
    if (!orgId) {
      if (isAdminRole(role)) {
        this.logger.log(`Admin role (${role}) with no orgId, returning all organisations`);
        return this.organisationsService.findAll();
      }
      this.logger.log('No orgId, returning empty');
      return [];
    }
    return this.organisationsService
      .findById(orgId)
      .then((o) => (o ? [o] : []));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user organisation' })
  @ApiResponse({ status: 200, description: 'Organisation details' })
  async getMyOrganisation(@Request() req: any) {
    if (!req.user.organisationId) {
      return null;
    }
    return this.organisationsService.findById(req.user.organisationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organisation by ID' })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Organisation found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: any) {
    if (req.user.organisationId !== id && !isAdminRole(req.user.role)) {
      return null;
    }
    return this.organisationsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'organisations', action: 'write' })
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organisation' })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Organisation updated' })
  update(
    @Param('id') id: string,
    @Body()
    updateDto: {
      name?: string;
      slug?: string;
      isActive?: boolean;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      countryCode?: string;
      currency?: string;
      logoUrl?: string;
    },
    @Request() req: any,
  ) {
    if (req.user.organisationId !== id && !isAdminRole(req.user.role)) {
      throw new ForbiddenException('You can only manage your own organisation');
    }
    return this.organisationsService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'organisations', action: 'write' })
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete organisation (deactivate)' })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Organisation deactivated' })
  remove(@Param('id') id: string, @Request() req: any) {
    if (req.user.organisationId !== id && !isAdminRole(req.user.role)) {
      throw new ForbiddenException('You can only manage your own organisation');
    }
    return this.organisationsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tree')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organisation hierarchy tree' })
  @ApiResponse({ status: 200, description: 'Organisation tree with branches' })
  getOrgTree(@Request() req: any) {
    if (!req.user.organisationId && !isAdminRole(req.user.role)) {
      return [];
    }
    return this.organisationsService
      .getOrgTree()
      .then((tree) =>
        tree.filter((o: any) => o.id === req.user.organisationId),
      );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/branches')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get branches for an organisation' })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'List of branches' })
  getBranches(@Param('id') id: string, @Request() req: any) {
    if (req.user.organisationId !== id && !isAdminRole(req.user.role)) {
      throw new ForbiddenException(
        'You can only access branches for your own organisation',
      );
    }
    return this.organisationsService.getBranches(id);
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'organisations', action: 'write' })
  @Post(':id/branches')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a branch for an organisation' })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 201, description: 'Branch created' })
  createBranch(
    @Param('id') id: string,
    @Body()
    createDto: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      countryCode?: string;
    },
    @Request() req: any,
  ) {
    if (req.user.organisationId !== id && !isAdminRole(req.user.role)) {
      throw new ForbiddenException(
        'You can only manage branches for your own organisation',
      );
    }
    return this.organisationsService.createBranch({
      ...createDto,
      organisationId: id,
    });
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'organisations', action: 'write' })
  @Patch(':orgId/branches/:branchId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a branch' })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiParam({ name: 'branchId', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Branch updated' })
  async updateBranch(
    @Param('orgId') orgId: string,
    @Param('branchId') branchId: string,
    @Body()
    updateDto: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      countryCode?: string;
      isActive?: boolean;
    },
    @Request() req: any,
  ) {
    if (req.user.organisationId !== orgId) {
      throw new ForbiddenException(
        'You can only manage branches for your own organisation',
      );
    }
    return this.organisationsService.updateBranch(branchId, updateDto);
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'organisations', action: 'write' })
  @Delete(':orgId/branches/:branchId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete branch (deactivate)' })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiParam({ name: 'branchId', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Branch deactivated' })
  removeBranch(
    @Param('orgId') orgId: string,
    @Param('branchId') branchId: string,
    @Request() req: any,
  ) {
    if (req.user.organisationId !== orgId) {
      throw new ForbiddenException(
        'You can only manage branches for your own organisation',
      );
    }
    return this.organisationsService.removeBranch(branchId);
  }
}
