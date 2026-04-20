import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, UpdateQuoteDto } from './dto/quotes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

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
      userId: req.user.sub,
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
    return this.quotesService.findByUser(req.user.sub);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  @ApiOperation({ summary: 'Get all organisation quotes' })
  @ApiResponse({ status: 200, description: 'List of organisation quotes' })
  async findAll(@Request() req: any) {
    return this.quotesService.findByOrganisation(req.user.organisationId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('pending')
  @ApiOperation({ summary: 'Get pending quotes' })
  @ApiResponse({ status: 200, description: 'List of pending quotes' })
  async findPending(@Request() req: any) {
    return this.quotesService.findPendingByOrganisation(req.user.organisationId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update quote status/price' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ status: 200, description: 'Quote updated' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateQuoteDto, @Request() req: any) {
    return this.quotesService.update(id, {
      status: updateDto.status,
      price: updateDto.price,
      assignedToId: updateDto.assignedToId,
    }, req.user.sub);
  }
}