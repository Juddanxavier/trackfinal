import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasbinGuard, Require } from '../../common/casbin';
import { CircuitBreakerRegistry } from '../../common/utils/circuit-breaker';

@ApiTags('Monitoring')
@Controller('monitoring')
@UseGuards(JwtAuthGuard, CasbinGuard)
@Require({ resource: 'monitoring', action: 'read' })
@ApiBearerAuth()
export class MonitoringController {
  @Get('circuit-breakers')
  @ApiOperation({ summary: 'Get circuit breaker metrics' })
  getCircuitBreakers() {
    return {
      circuitBreakers: CircuitBreakerRegistry.getAllMetrics(),
    };
  }
}
