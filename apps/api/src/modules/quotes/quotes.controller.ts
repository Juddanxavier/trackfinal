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
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  DeleteQuoteDto,
} from './dto/quotes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

interface PaginationQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  organisationId?: string;
}

function sanitizeQuoteForCustomer(quote: any) {
  if (!quote) return null;
  const { price, assignedToId, assignedTo, ...sanitized } = quote;
  return sanitized;
}

@ApiTags('quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create quote request' })
  @ApiResponse({ status: 201, description: 'Quote created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createDto: CreateQuoteDto, @Request() req: any) {
    return this.quotesService.create({
      organisationId: req.user.organisationId,
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
    const quotes = await this.quotesService.findByUser(req.user.id);
    return quotes.map(sanitizeQuoteForCustomer);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
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

    if (
      !isAdmin &&
      query.organisationId &&
      query.organisationId !== userOrgId
    ) {
      throw new ForbiddenException('You can only access your own organisation');
    }

    const organisationId =
      isAdmin && query.organisationId
        ? query.organisationId
        : isAdmin && !query.organisationId
          ? undefined
          : userOrgId;

    return this.quotesService.findWithPagination({
      organisationId,
      userId: query.userId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 1000,
      search: query.search,
      status: query.status as any,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('pending')
  @ApiOperation({ summary: 'Get pending quotes' })
  @ApiResponse({ status: 200, description: 'List of pending quotes' })
  async findPending(@Request() req: any) {
    return this.quotesService.findPendingByOrganisation(
      req.user.organisationId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quote statistics' })
  @ApiResponse({ status: 200, description: 'Quote statistics' })
  async getStats(
    @Request() req: any,
    @Query() query: { organisationId?: string },
  ) {
    const userRole = req.user.role;
    const userOrgId = req.user.organisationId;
    const isAdmin = userRole === Role.ADMIN;

    if (
      !isAdmin &&
      query.organisationId &&
      query.organisationId !== userOrgId
    ) {
      throw new ForbiddenException(
        'You can only access your own organisation stats',
      );
    }

    const organisationId =
      isAdmin && query.organisationId ? query.organisationId : userOrgId;

    return this.quotesService.getStats(organisationId);
  }

  @Get('activity')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Get quote activity history',
    description: 'Get daily quote creation counts for charting',
  })
  @ApiResponse({ status: 200, description: 'Activity history data' })
  async getActivityHistory(
    @Request() req: any,
    @Query() query: { organisationId?: string; days?: string },
  ) {
    if (
      req.user.role !== Role.ADMIN &&
      query.organisationId &&
      query.organisationId !== req.user.organisationId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return this.quotesService.getActivityHistory(
      query.organisationId || req.user.organisationId,
      query.days ? parseInt(query.days) : 30,
    );
  }

  @Post(':id/send-email')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
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
