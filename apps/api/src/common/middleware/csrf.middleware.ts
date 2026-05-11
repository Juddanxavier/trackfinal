import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { csrfSync } from 'csrf-sync';

const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req) => {
    return (
      req.headers['x-csrf-token'] as string ||
      req.headers['xsrf-token'] as string ||
      (req.body as Record<string, unknown>)?._csrf as string ||
      (req.query as Record<string, unknown>)?._csrf as string
    );
  },
});

const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const CSRF_EXCLUDED_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/customer-register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/webhook',
];

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    if (!CSRF_PROTECTED_METHODS.includes(req.method)) {
      return next();
    }

    if (CSRF_EXCLUDED_PATHS.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    csrfSynchronisedProtection(req, res, (err?: string) => {
      if (err) {
        this.logger.warn(`CSRF validation failed: ${req.path}`, err || 'unknown');
        throw new UnauthorizedException('Invalid CSRF token');
      }
      next();
    });
  }
}