import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      success: true,
      message: 'API is running successfully',
      data: {
        name: process.env.APP_NAME || 'GT Express API',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
    };
  }

  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }

  getDetailedHealth() {
    return {
      status: 'ok',
      services: {
        api: 'running',
        database: 'connected', // later replace with real DB check
        cache: 'not_configured', // Redis etc
      },
      memory: {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
