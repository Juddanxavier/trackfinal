import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search across shipments, quotes, and users' })
  async search(
    @Query('q') query: string,
    @Request() req: any,
  ) {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const organisationId = req.user.organisationId;
    if (!organisationId) {
      throw new BadRequestException('User must be assigned to an organisation');
    }

    return this.searchService.search(query.trim(), organisationId);
  }
}
