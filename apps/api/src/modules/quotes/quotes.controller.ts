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
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { UsersService, OrganisationsService } from '../users/services';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  DeleteQuoteDto,
} from './dto/quotes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasbinGuard, Require } from '../../common/casbin';
import { Role } from '../../common/enums/role.enum';

interface PaginationQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

function sanitizeQuoteForCustomer(quote: any) {
  if (!quote) return null;
  const { assignedToId, assignedTo, organisationId, userId, ...sanitized } = quote;
  return sanitized;
}

@ApiTags('quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly usersService: UsersService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create quote request' })
  @ApiResponse({ status: 201, description: 'Quote created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createDto: CreateQuoteDto, @Request() req: any) {
    console.log('Create quote - user:', req.user);
    
    let organisationId = req.user.organisationId;
    console.log('Initial org ID:', organisationId);
    
    if (!organisationId) {
      try {
        let org = await this.organisationsService.findBySlug('gajan-traders');
        console.log('Found org:', org);
        if (!org) {
          org = await this.organisationsService.create({
            name: 'Gajan Traders',
            slug: 'gajan-traders',
          });
          console.log('Created org:', org);
        }
        organisationId = org.id;
        await this.usersService.update(req.user.id, { organisationId });
        console.log('Updated user org');
      } catch (err) {
        console.error('Error getting org:', err);
        throw err;
      }
    }
    
    return this.quotesService.create({
      organisationId,
      branchId: req.user.branchId || null,
      userId: req.user.id,
      originCountry: createDto.originCountry,
      destinationCountry: createDto.destinationCountry,
      goodsType: createDto.goodsType,
      weight: createDto.weight,
      email: createDto.email,
      phone: createDto.phone,
      remarks: createDto.remarks,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my quotes' })
  @ApiResponse({ status: 200, description: 'List of my quotes' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMyQuotes(@Request() req: any) {
    const quotes = await this.quotesService.findByUser(req.user.id, req.user.organisationId);
    return quotes.map(sanitizeQuoteForCustomer);
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'quotes', action: 'read' })
  @Get()
  @ApiOperation({ summary: 'Get all organisation quotes with pagination' })
  @ApiResponse({ status: 200, description: 'List of organisation quotes' })
  async findAll(
    @Request() req: any,
    @Query() query: PaginationQuery & { userId?: string },
  ) {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const isAdmin = userRole === Role.ADMIN;
    const isStaff = userRole === Role.STAFF;

    const organisationId = userOrgId;
    const branchId = isStaff ? req.user.branchId : undefined;

    return this.quotesService.findWithPagination({
      organisationId,
      branchId,
      userId: query.userId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 1000,
      search: query.search,
      status: query.status,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    });
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'quotes', action: 'read' })
  @Get('pending')
  @ApiOperation({ summary: 'Get pending quotes' })
  @ApiResponse({ status: 200, description: 'List of pending quotes' })
  async findPending(@Request() req: any) {
    const branchId = req.user.role === Role.STAFF ? req.user.branchId : undefined;
    return this.quotesService.findPendingByOrganisation(
      req.user.organisationId,
      branchId,
    );
  }

  @UseGuards(CasbinGuard)
  @Require({ resource: 'quotes', action: 'write:own' })
  @Patch(':id')
  @ApiOperation({ summary: 'Update quote status/price' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ status: 200, description: 'Quote updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuoteDto,
    @Request() req: any,
  ) {
    const quote = await this.quotesService.findById(id);

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (
      req.user.role !== Role.ADMIN &&
      quote.organisationId !== req.user.organisationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return this.quotesService.update(
      id,
      {
        status: updateDto.status,
        price: updateDto.price,
        assignedToId: updateDto.assignedToId,
        remarks: updateDto.remarks,
      },
      req.user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quote (own pending or admin hard delete)' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ status: 200, description: 'Quote deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { reason?: string; hardDelete?: boolean },
  ) {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const userId = req.user.id;

    if (userRole === Role.ADMIN && body?.hardDelete) {
      const quote = await this.quotesService.findById(id);
      if (!quote) {
        throw new NotFoundException('Quote not found');
      }
      if (quote.organisationId !== userOrgId) {
        throw new ForbiddenException(
          'Quote does not belong to your organisation',
        );
      }
      return this.quotesService.hardDelete(id);
    }

    if (userRole === Role.CUSTOMER) {
      const quote = await this.quotesService.findById(id);
      if (!quote) {
        throw new NotFoundException('Quote not found');
      }
      if (quote.userId !== userId) {
        throw new ForbiddenException('You can only delete your own quotes');
      }
      if (quote.status !== 'pending') {
        throw new ForbiddenException('You can only delete pending quotes');
      }
      return this.quotesService.delete(id, userId, 'Owner deleted');
    }

    const quote = await this.quotesService.findById(id);
    if (!quote) {
      throw new NotFoundException('Quote not found');
    }
    if (quote.organisationId !== userOrgId) {
      throw new ForbiddenException(
        'Quote does not belong to your organisation',
      );
    }
    return this.quotesService.delete(id, userId, body?.reason);
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'quotes', action: 'read' })
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quote statistics' })
  @ApiResponse({ status: 200, description: 'Quote statistics' })
  async getStats(
    @Request() req: any,
    @Query() query: { branchId?: string },
  ) {
    const organisationId = req.user.organisationId;
    const branchId = req.user.role === Role.STAFF ? req.user.branchId : query.branchId;
    return this.quotesService.getStats(organisationId, branchId);
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'quotes', action: 'read' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quote activity history', description: 'Get daily quote creation counts for charting' })
  @ApiResponse({ status: 200, description: 'Activity history data' })
  async getActivityHistory(
    @Request() req: any,
    @Query() query: { days?: string },
  ) {
    const organisationId = req.user.organisationId;
    const branchId = req.user.role === Role.STAFF ? req.user.branchId : undefined;
    return this.quotesService.getActivityHistory(
      organisationId,
      branchId,
      query.days ? parseInt(query.days) : 30,
    );
  }

  @Post(':id/send-email')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'quotes', action: 'read' })
  @ApiOperation({ summary: 'Send custom email to quote customer' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  async sendEmail(
    @Param('id') id: string,
    @Body() body: { subject: string; message: string },
    @Request() req: any,
  ) {
    const quote = await this.quotesService.findById(id);

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (
      req.user.role !== Role.ADMIN &&
      quote.organisationId !== req.user.organisationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return this.quotesService.sendCustomEmail(
      quote.email,
      body.subject,
      body.message,
    );
  }
}
