import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService, PaginatedResult } from '../users/services';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  organisationId?: string;
  sortBy?: string;
  sortOrder?: string;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  @ApiOperation({ summary: 'Get users with pagination, search, filter' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Staff only' })
  findAll(@Request() req: any, @Query() query: PaginationQuery): Promise<PaginatedResult<any>> {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const isAdmin = userRole === Role.ADMIN;
    
    const organisationId = isAdmin && query.organisationId 
      ? query.organisationId 
      : isAdmin && !query.organisationId
        ? undefined
        : userOrgId;
    
    return this.usersService.findWithPagination({
      organisationId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
      search: query.search,
      role: query.role as Role | undefined,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CUSTOMER)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.sub);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('stats/all')
  @ApiOperation({ summary: 'Get stats for all organisations' })
  @ApiResponse({ status: 200, description: 'Overall stats' })
  getAllStats() {
    return this.usersService.getAllStats();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('invite')
  @ApiOperation({ summary: 'Invite new user' })
  @ApiResponse({ status: 201, description: 'User invited' })
  invite(@Body() inviteDto: { email: string; name: string; role?: Role; organisationId?: string }, @Request() req: any) {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const isAdmin = userRole === Role.ADMIN;
    
    const role = inviteDto.role || Role.CUSTOMER;
    const organisationId = inviteDto.organisationId || userOrgId;
    
    if (!isAdmin && role !== Role.CUSTOMER) {
      throw new Error('Staff can only invite customers');
    }
    if (!isAdmin && organisationId !== userOrgId) {
      throw new Error('Staff can only invite users to their organisation');
    }
    
    return this.usersService.invite({
      email: inviteDto.email,
      name: inviteDto.name,
      role,
      organisationId,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.usersService.findById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  update(@Param('id') id: string, @Body() updateDto: { name?: string; role?: Role; isActive?: boolean }, @Request() req: any) {
    return this.usersService.update(id, updateDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.usersService.remove(id);
  }
}