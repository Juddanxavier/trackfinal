import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import type {
  ReportStats,
  ChartDataPoint,
  RouteData,
  CarrierData,
  CustomerRetention,
} from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

interface AuthUser {
  role: string;
  organisationId: string;
}

interface AuthRequest {
  user: AuthUser;
}

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get report summary',
    description:
      'Get analytics, operational, retention, geography, and carrier data',
  })
  @ApiResponse({ status: 200, description: 'Report summary data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSummary(
    @Request() req: AuthRequest,
    @Query('range') range?: string,
    @Query('organisationId') organisationId?: string,
  ): Promise<{
    stats: ReportStats;
    chartData: ChartDataPoint[];
    routes: RouteData[];
    carriers: CarrierData[];
    retention: CustomerRetention;
  }> {
    const targetOrgId = this.resolveOrgId(req, organisationId);

    return this.reportsService.getReportSummary({
      organisationId: targetOrgId,
      range: range || '30d',
    });
  }

  private resolveOrgId(
    req: AuthRequest,
    organisationId?: string,
  ): string | undefined {
    const userRole = req.user.role?.toUpperCase();
    const userOrgId = req.user.organisationId;

    if (
      (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') &&
      organisationId
    ) {
      return organisationId;
    } else if (userRole === 'STAFF' || userRole === 'CUSTOMER') {
      return userOrgId;
    }
    return undefined;
  }
}
