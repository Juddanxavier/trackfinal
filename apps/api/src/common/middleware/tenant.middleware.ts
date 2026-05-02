import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
  user?: unknown;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantRequest, res: Response, next: NextFunction) {
    const user = req.user as any;
    if (user?.organisationId) {
      req.tenantId = user.organisationId;
    }
    next();
  }
}
