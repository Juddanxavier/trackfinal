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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('organisations')
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new organisation' })
  @ApiResponse({ status: 201, description: 'Organisation created' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  create(
    @Body() createDto: { name: string; slug: string },
    @Request() req: any,
  ) {
    return this.organisationsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all organisations' })
  @ApiResponse({ status: 200, description: 'List of organisations' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findAll(@Request() req: any) {
    return this.organisationsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user organisation' })
  @ApiResponse({ status: 200, description: 'Organisation details' })
  getMyOrganisation(@Request() req: any) {
    return this.organisationsService.findById(req.user.organisationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organisation by ID' })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Organisation found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.organisationsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organisation' })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Organisation updated' })
  update(
    @Param('id') id: string,
    @Body() updateDto: { name?: string; slug?: string; isActive?: boolean },
    @Request() req: any,
  ) {
    return this.organisationsService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete organisation' })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Organisation deleted' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.organisationsService.remove(id);
  }
}
