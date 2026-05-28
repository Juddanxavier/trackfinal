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

  use(req: Request, res: Response, next: NextFunction) {
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

    console.log(
      `--> ${method} ${reqUrl} [correlationId=${correlationId}] ip=${ip} ua=${userAgent}`,
    );

    const originalEnd = res.end;
    const log = (...args: any[]) => console.log(...args);
    const logError = (...args: any[]) => console.error(...args);
    const logWarn = (...args: any[]) => console.warn(...args);

    res.end = function (...args: any[]) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode || 0;

      const message = `<-- ${method} ${reqUrl} ${statusCode} ${duration}ms [correlationId=${correlationId}]`;

      if (statusCode >= 500) {
        logError(message);
      } else if (statusCode >= 400) {
        logWarn(message);
      } else {
        log(message);
      }

      return originalEnd.apply(res, args);
    };

    next();
  }
}
