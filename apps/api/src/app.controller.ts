import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getAppInfo() {
    return this.appService.getAppInfo();
  }

  @Public()
  @Get('csrf/token')
  getCsrfToken() {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    return { csrfToken: token };
  }
}
