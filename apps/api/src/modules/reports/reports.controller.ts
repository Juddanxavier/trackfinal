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
  CarrierAnalyticsResult,
} from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasbinGuard, Require } from '../../common/casbin';

interface AuthUser {
  role: string;
  organisationId: string;
  branchId?: string | null;
}

interface AuthRequest {
  user: AuthUser;
}

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, CasbinGuard)
@Require({ resource: 'reports', action: 'read' })
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
    @Query('branchId') branchId?: string,
  ): Promise<{
    stats: ReportStats;
    chartData: ChartDataPoint[];
    routes: RouteData[];
    carriers: CarrierData[];
    retention: CustomerRetention;
    organisation?: Record<string, unknown>;
    branch?: Record<string, unknown>;
  }> {
    const targetOrgId = this.resolveOrgId(req, organisationId);
    const targetBranchId = this.resolveBranchId(req, branchId);

    const [summary, entityInfo] = await Promise.all([
      this.reportsService.getReportSummary({
        organisationId: targetOrgId,
        branchId: targetBranchId,
        range: range || '30d',
      }),
      this.reportsService.getEntityInfo(targetOrgId, targetBranchId),
    ]);

    return {
      ...summary,
      ...entityInfo,
    };
  }

  @Get('carrier-analytics')
  @ApiOperation({
    summary: 'Get carrier performance analytics',
    description:
      'Deep carrier metrics: on-time rate, transit percentiles, exception rates, trends',
  })
  @ApiResponse({ status: 200, description: 'Carrier analytics data' })
  async getCarrierAnalytics(
    @Request() req: AuthRequest,
    @Query('range') range?: string,
    @Query('organisationId') organisationId?: string,
    @Query('branchId') branchId?: string,
    @Query('slaDays') slaDays?: string,
  ): Promise<CarrierAnalyticsResult> {
    const targetOrgId = this.resolveOrgId(req, organisationId);
    const targetBranchId = this.resolveBranchId(req, branchId);

    return this.reportsService.getCarrierAnalytics({
      organisationId: targetOrgId,
      branchId: targetBranchId,
      range: range || '90d',
      slaDays: slaDays ? parseInt(slaDays, 10) : 7,
    });
  }

  private resolveOrgId(
    req: AuthRequest,
    organisationId?: string,
  ): string | undefined {
    const userOrgId = req.user.organisationId;

    if (req.user.role === 'admin' && organisationId) {
      return organisationId;
    }
    return userOrgId;
  }

  private resolveBranchId(
    req: AuthRequest,
    branchId?: string,
  ): string | undefined {
    if (req.user.role === 'staff' && req.user.branchId) {
      return req.user.branchId;
    }

    if (req.user.role === 'admin' && branchId) {
      return branchId;
    }

    return undefined;
  }
}
