import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
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
  @Get('lookup')
  @ApiOperation({ summary: 'Lookup user by email or phone' })
  @ApiResponse({ status: 200, description: 'User info if found' })
  lookupUser(@Query('email') email?: string, @Query('phone') phone?: string) {
    return this.usersService.lookupUser(email, phone);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  @ApiOperation({ summary: 'Get users with pagination, search, filter' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Staff only' })
  findAll(
    @Request() req: any,
    @Query() query: PaginationQuery,
  ): Promise<PaginatedResult<any>> {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const isAdmin = userRole === Role.ADMIN;

    const organisationId =
      isAdmin && query.organisationId
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
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('stats')
  @ApiOperation({ summary: 'Get stats for organisation' })
  @ApiResponse({ status: 200, description: 'Organisation stats' })
  getStats(@Request() req: any, @Query() query: { organisationId?: string }) {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isAdmin && !userOrgId) {
      return { total: 0, active: 0, customers: 0, staff: 0 };
    }

    const organisationId =
      isAdmin && query.organisationId ? query.organisationId : userOrgId;

    return this.usersService.getAllStats(organisationId);
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
  invite(
    @Body()
    inviteDto: {
      email: string;
      name: string;
      phoneNumber?: string;
      role?: Role;
      organisationId?: string;
    },
    @Request() req: any,
  ) {
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
      phoneNumber: inviteDto.phoneNumber || undefined,
      role,
      organisationId,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CUSTOMER)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Admin or Staff can view any user, others can only view own profile',
  })
  findOne(@Param('id') id: string, @Request() req: any) {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const userSub = req.user.sub;

    if (userRole === Role.ADMIN) {
      return this.usersService.findById(id);
    }

    if (userRole === Role.STAFF) {
      const targetUser = this.usersService.findById(id);
      return targetUser;
    }

    if (userSub === id) {
      return this.usersService.findById(id);
    }

    throw new ForbiddenException('You can only view your own profile');
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  update(
    @Param('id') id: string,
    @Body()
    updateDto: {
      name?: string;
      phoneNumber?: string | null;
      role?: Role;
      isActive?: boolean;
    },
    @Request() req: any,
  ) {
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
