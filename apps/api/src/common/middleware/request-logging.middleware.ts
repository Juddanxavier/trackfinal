import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      startTime: number;
    }
  }
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use = (req: Request, res: Response, next: NextFunction): void => {
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      randomBytes(8).toString('hex');
    const startTime = Date.now();
    const method = req.method;
    const reqUrl = req.url;
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    req.correlationId = correlationId;
    req.startTime = startTime;

    res.setHeader('X-Correlation-ID', correlationId);

    this.logger.log(
      `--> ${method} ${reqUrl} [correlationId=${correlationId}] ip=${ip} ua=${userAgent}`,
    );

    const originalEnd = res.end;

    res.end = function (...args: any[]) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode || 0;

      const message = `<-- ${method} ${reqUrl} ${statusCode} ${duration}ms [correlationId=${correlationId}]`;

      if (statusCode >= 500) {
        Logger.error(message, undefined, 'HTTP');
      } else if (statusCode >= 400) {
        Logger.warn(message, 'HTTP');
      } else {
        Logger.log(message, 'HTTP');
      }

      return originalEnd.apply(res, args);
    };

    next();
  }
}
