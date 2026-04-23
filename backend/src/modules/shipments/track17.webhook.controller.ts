import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ShipmentsService } from './shipments.service';
import { TrackingProviderFactory } from './tracking.factory';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class Track17WebhookController {
  constructor(
    private shipmentsService: ShipmentsService,
    private trackingFactory: TrackingProviderFactory,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('track17')
  @ApiOperation({
    summary: 'Track17 webhook v2',
    description: 'Receives tracking updates from Track17 API v2',
  })
  @ApiHeader({
    name: '17token',
    description: 'API token for authentication',
    required: false,
  })
  @ApiBody({ description: 'Track17 webhook payload (v2 format)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async handleWebhook(@Body() body: any, @Headers('17token') token: string) {
    const expectedToken = this.configService.get('TRACK17_API_KEY');

    if (expectedToken && token !== expectedToken) {
      throw new UnauthorizedException('Invalid token');
    }

    try {
      const { event, data } = body;

      if (event === 'TRACKING_UPDATED') {
        const { number, carrier, tracking } = data;

        if (!number || !carrier) {
          return {
            received: true,
            processed: false,
            reason: 'Missing number or carrier',
          };
        }

        await this.shipmentsService.processWebhookUpdate(
          carrier.toString(),
          number,
          tracking,
        );
        return { received: true, processed: true };
      }

      if (event === 'TRACKING_STOP') {
        const { number, carrier } = data;
        console.log(`[Webhook] Tracking stopped for ${carrier}/${number}`);
        return { received: true, processed: true };
      }

      return { received: true, processed: false, reason: 'Unknown event type' };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { received: true, processed: false, error: error.message };
    }
  }
}
