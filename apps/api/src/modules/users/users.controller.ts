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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  UsersService,
  PaginatedResult,
  OrganisationsService,
} from '../users/services';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasbinGuard, Require } from '../../common/casbin';
import { Role, isAdminRole } from '../../common/enums/role.enum';

interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  organisationId?: string;
  branchId?: string;
  sortBy?: string;
  sortOrder?: string;
  all?: string;
}

function sanitizeUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organisationId: user.organisationId,
    organisationName: user.organisationName || null,
    branchId: user.branchId || null,
    branchName: user.branchName || null,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  @Get('lookup')
  @ApiOperation({ summary: 'Lookup user by email or phone' })
  @ApiResponse({ status: 200, description: 'User info if found' })
  lookupUser(
    @Request() req: any,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    return this.usersService.lookupUser(email, phone, req.user.organisationId);
  }

  @Get('by-email')
  @ApiOperation({ summary: 'Check if user exists by email' })
  @ApiResponse({ status: 200, description: 'User if found, null otherwise' })
  async findByEmail(@Query('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { exists: false };
    }
    return {
      exists: true,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'users', action: 'read' })
  @Get()
  @ApiOperation({ summary: 'Get users with pagination, search, filter' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Staff only' })
  async findAll(
    @Request() req: any,
    @Query() query: PaginationQuery,
  ): Promise<PaginatedResult<any>> {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const isSuperAdmin = userRole === Role.SUPERADMIN;
    const isAdmin = userRole === Role.ADMIN;
    const isStaff = userRole === Role.STAFF;

    const branchId = isStaff ? req.user.branchId : query.branchId;

    let excludeRoles: Role[] | undefined;
    if (isSuperAdmin) {
      excludeRoles = undefined;
    } else if (isAdmin) {
      excludeRoles = [Role.ADMIN];
    } else {
      excludeRoles = [Role.ADMIN, Role.STAFF];
    }

    const result = await this.usersService.findWithPagination({
      organisationId: isSuperAdmin
        ? query.organisationId || undefined
        : userOrgId,
      branchId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
      search: query.search,
      role: query.role as Role | undefined,
      excludeRoles,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    });

    return {
      ...result,
      data: result.data.map(sanitizeUser),
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return sanitizeUser(user);
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'users', action: 'read' })
  @Get('stats')
  @ApiOperation({ summary: 'Get stats for organisation' })
  @ApiResponse({ status: 200, description: 'Organisation stats' })
  async getStats(
    @Request() req: any,
    @Query() query: { organisationId?: string },
  ) {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const isAdmin = isAdminRole(userRole);

    if (!isAdmin && !userOrgId) {
      return { total: 0, active: 0, customers: 0, staff: 0 };
    }

    let organisationId: string | undefined;
    if (isAdmin) {
      organisationId = query.organisationId || userOrgId || undefined;
    } else {
      organisationId = userOrgId;
    }

    if (userOrgId && organisationId !== userOrgId) {
      throw new ForbiddenException(
        'You can only access stats for your organisation',
      );
    }

    return this.usersService.getAllStats(organisationId);
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'users', action: 'read' })
  @Get('stats/all')
  @ApiOperation({ summary: 'Get stats for all branches in your organisation' })
  @ApiResponse({ status: 200, description: 'Organisation stats' })
  getAllStats(@Request() req: any) {
    return this.usersService.getAllStats(req.user.organisationId);
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'users', action: 'write' })
  @Post('invite')
  @ApiOperation({ summary: 'Invite new user' })
  @ApiResponse({ status: 201, description: 'User invited' })
  async invite(
    @Body()
    inviteDto: {
      email: string;
      name: string;
      phoneNumber?: string;
      organisationId?: string;
    },
    @Request() req: any,
  ) {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;

    if (!isAdminRole(userRole)) {
      throw new ForbiddenException('Only admins can invite users');
    }

    const organisationId = inviteDto.organisationId || userOrgId;

    if (!organisationId) {
      throw new BadRequestException('Organisation ID is required');
    }

    const result = await this.usersService.invite({
      email: inviteDto.email,
      name: inviteDto.name,
      phoneNumber: inviteDto.phoneNumber,
      role: Role.CUSTOMER,
      organisationId,
    });

    return sanitizeUser(result);
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'users', action: 'read' })
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Admin or Staff can view users in their org, others can only view own profile',
  })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const userId = req.user.id;

    if (userRole === Role.SUPERADMIN) {
      const targetUser = await this.usersService.findById(id);

      if (!targetUser) {
        throw new NotFoundException('User not found');
      }

      return sanitizeUser(targetUser);
    }

    if (userRole === Role.ADMIN || userRole === Role.STAFF) {
      const targetUser = await this.usersService.findById(id);

      if (!targetUser) {
        throw new NotFoundException('User not found');
      }

      if (targetUser.organisationId !== userOrgId) {
        throw new ForbiddenException(
          'You can only view users in your organisation',
        );
      }

      return sanitizeUser(targetUser);
    }

    if (userId === id) {
      const targetUser = await this.usersService.findById(id);
      return sanitizeUser(targetUser);
    }

    throw new ForbiddenException('You can only view your own profile');
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'users', action: 'write' })
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(
    @Param('id') id: string,
    @Body()
    updateDto: {
      name?: string;
      phoneNumber?: string | null;
      isActive?: boolean;
      role?: string;
    },
    @Request() req: any,
  ) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check organisation boundary - users can only update users in their own organisation
    // Super admins (no organisationId) can update users in any organisation
    if (
      req.user.organisationId &&
      user.organisationId !== req.user.organisationId
    ) {
      throw new ForbiddenException(
        'You can only update users in your organisation',
      );
    }

    if (updateDto.role && req.user.id === id && req.user.role === Role.ADMIN) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const result = await this.usersService.update(id, {
      ...updateDto,
      role: updateDto.role as Role,
    });
    return sanitizeUser(result);
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'users', action: 'delete' })
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check organisation boundary - users can only delete users in their own organisation
    // Super admins (no organisationId) can delete users in any organisation
    if (
      req.user.organisationId &&
      user.organisationId !== req.user.organisationId
    ) {
      throw new ForbiddenException(
        'You can only delete users in your organisation',
      );
    }

    return this.usersService.remove(id);
  }
}
