import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { db } from '../../database/index';
import { sql } from 'drizzle-orm';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const orgId = request.user?.organisationId;

    if (orgId) {
      try {
        await db.execute(
          sql`SELECT set_config('app.organisation_id', ${orgId}, true)`,
        );
      } catch (err) {
        this.logger.error(`Failed to set tenant context: ${err}`);
      }
    }

    return next.handle();
  }
}
