import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CircuitBreakerRegistry } from '../../common/utils/circuit-breaker';

@ApiTags('Monitoring')
@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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
