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

function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, googleId, ...sanitized } = user;
  return sanitized;
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

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
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
    const isAdmin = userRole === Role.ADMIN;

    const organisationId =
      isAdmin && query.organisationId
        ? query.organisationId
        : isAdmin && !query.organisationId
          ? undefined
          : userOrgId;

    const result = await this.usersService.findWithPagination({
      organisationId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
      search: query.search,
      role: query.role as Role | undefined,
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

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('stats')
  @ApiOperation({ summary: 'Get stats for organisation' })
  @ApiResponse({ status: 200, description: 'Organisation stats' })
  async getStats(
    @Request() req: any,
    @Query() query: { organisationId?: string },
  ) {
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

    if (userRole !== Role.ADMIN) {
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

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CUSTOMER)
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

    if (userRole === Role.ADMIN || userRole === Role.STAFF) {
      const targetUser = await this.usersService.findById(id);

      if (!targetUser) {
        throw new NotFoundException('User not found');
      }

      if (userRole === Role.STAFF && targetUser.organisationId !== userOrgId) {
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

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
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

    if (
      req.user.role === Role.ADMIN &&
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

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.organisationId !== req.user.organisationId) {
      throw new ForbiddenException(
        'You can only delete users in your organisation',
      );
    }

    return this.usersService.remove(id);
  }
}
