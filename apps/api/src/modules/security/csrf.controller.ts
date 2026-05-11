import { Controller, Get, Request, Response } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { csrfSync } from 'csrf-sync';

const { generateToken } = csrfSync();

@ApiTags('security')
@Controller('csrf')
export class CsrfController {
  @Public()
  @Get('token')
  @ApiOperation({ summary: 'Get CSRF token' })
  @ApiResponse({ status: 200, description: 'CSRF token generated' })
  getToken(@Request() req, @Response() res) {
    const token = generateToken(req);
    res.json({
      csrfToken: token,
    });
  }
}