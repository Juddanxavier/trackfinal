import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsAppTemplate {
  templateName: string;
  variables: string[];
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly baseUrl = 'https://api.msg91.com/api/v5';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MSG91_API_KEY', '');
    this.sender = this.configService.get<string>('MSG91_WHATSAPP_SENDER', '');
  }

  async sendTemplate(
    phone: string,
    template: WhatsAppTemplate,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.logger.log(
      `📱 [WhatsApp TEST] Phone: ${phone} | Template: ${template.templateName} | Variables:`,
      template.variables,
    );

    if (!this.apiKey) {
      this.logger.log(
        '📱 [DEV] WhatsApp notification (no API key configured):',
        phone,
        template.templateName,
        template.variables,
      );
      return { success: true, messageId: 'dev-' + Date.now() };
    }

    try {
      const url = `${this.baseUrl}/whatsapp`;
      const payload = {
        sender: this.sender,
        mobile: phone,
        template_name: template.templateName,
        variables: template.variables,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        type?: string;
        message_id?: string;
        message?: string;
      };

      if (result.type === 'success') {
        return { success: true, messageId: result.message_id };
      } else {
        return { success: false, error: result.message || 'Unknown error' };
      }
    } catch (error) {
      this.logger.error('WhatsApp send error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to send WhatsApp',
      };
    }
  }

  async sendShipmentCreatedNotification(
    phone: string,
    trackingNumber: string,
    carrierCode: string,
  ): Promise<any> {
    return this.sendTemplate(phone, {
      templateName: 'shipment_created',
      variables: [trackingNumber, carrierCode],
    });
  }

  async sendShipmentInTransitNotification(
    phone: string,
    trackingNumber: string,
    status: string,
    location?: string,
  ): Promise<any> {
    return this.sendTemplate(phone, {
      templateName: 'shipment_in_transit',
      variables: [trackingNumber, status, location || 'In transit'],
    });
  }

  async sendShipmentDeliveredNotification(
    phone: string,
    trackingNumber: string,
    deliveredAt: string,
  ): Promise<any> {
    return this.sendTemplate(phone, {
      templateName: 'shipment_delivered',
      variables: [trackingNumber, deliveredAt],
    });
  }

  private replaceTemplateVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }
}
