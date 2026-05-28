import {
  Controller,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasbinGuard, Require } from '../../common/casbin';
import { TrackingSyncService } from './tracking-sync.service';
import { SeventeenTrackService } from './seventeen-track.service';
import { timingSafeEqual } from '../../common/utils/crypto.util';

@Controller('webhook/17track')
export class SeventeenTrackWebhookController {
  constructor(
    private configService: ConfigService,
    private trackingSyncService: TrackingSyncService,
    private seventeenTrackService: SeventeenTrackService,
  ) {}

  @Post()
  @Public()
  async handleWebhook(@Body() payload: any[]) {
    console.log(
      '[17Track Webhook] Received:',
      JSON.stringify(payload).slice(0, 200),
    );

    const webhookToken = this.configService.get<string>(
      'SEVENTEEN_WEBHOOK_TOKEN',
    );
    const providedToken = payload[0]?.token || payload[0]?.webhook_token;

    if (
      webhookToken &&
      (!providedToken || !timingSafeEqual(providedToken, webhookToken))
    ) {
      console.log('[17Track Webhook] Invalid token');
      throw new UnauthorizedException('Invalid webhook token');
    }

    try {
      const cleanPayload = payload.map((item) => ({
        number: item.number,
        carrier: item.carrier,
        tag: item.tag,
        track_info: item.track_info,
      }));

      return this.trackingSyncService.handleWebhook(cleanPayload);
    } catch (err) {
      console.error('[17Track Webhook] ERROR:', err);
      throw err;
    }
  }

  @Post('settings')
  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'tracking', action: 'write' })
  async updateSettings(
    @Body()
    body: {
      organisationId?: string;
      webhookEnabled?: boolean;
      pollingEnabled?: boolean;
      pollingIntervalMinutes?: number;
      retryAttempts?: number;
      retryDelaySeconds?: number;
    },
  ) {
    const settings = await this.seventeenTrackService.updateSettings(
      body.organisationId || null,
      {
        webhookEnabled: body.webhookEnabled,
        pollingEnabled: body.pollingEnabled,
        pollingIntervalMinutes: body.pollingIntervalMinutes,
        retryAttempts: body.retryAttempts,
        retryDelaySeconds: body.retryDelaySeconds,
      },
    );
    return { success: true, settings };
  }

  @Post('settings/:organisationId')
  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'tracking', action: 'write' })
  async updateOrgSettings(
    @Body()
    body: {
      webhookEnabled?: boolean;
      pollingEnabled?: boolean;
      pollingIntervalMinutes?: number;
      retryAttempts?: number;
      retryDelaySeconds?: number;
    },
  ) {
    return this.updateSettings(body);
  }
}
