import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { Track17Service } from './track17.service';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class Track17WebhookController {
  constructor(
    private shipmentsService: ShipmentsService,
    private track17Service: Track17Service,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('track17')
  @ApiOperation({ summary: 'Track17 webhook', description: 'Receives tracking updates from Track17 API' })
  @ApiHeader({ name: 'x-webhook-key', description: 'Webhook authentication key', required: false })
  @ApiBody({ description: 'Track17 webhook payload' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 401, description: 'Invalid webhook key' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-webhook-key') webhookKey: string,
  ) {
    const expectedKey = this.configService.get('TRACK17_WEBHOOK_KEY');

    if (expectedKey && webhookKey !== expectedKey) {
      throw new UnauthorizedException('Invalid webhook key');
    }

    try {
      const { tracking_number, carrier_code } = body;

      if (!tracking_number || !carrier_code) {
        return { received: true, processed: false, reason: 'Missing tracking_number or carrier_code' };
      }

      await this.shipmentsService.processWebhookUpdate(carrier_code, tracking_number, body);

      return { received: true, processed: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { received: true, processed: false, error: error.message };
    }
  }
}