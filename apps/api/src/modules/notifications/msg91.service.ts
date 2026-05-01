import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface MSG91Response {
  success: boolean;
  request_id?: string;
  error?: string;
}
@Injectable()
export class MSG91Service {
  private readonly logger = new Logger(MSG91Service.name);
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly baseUrl = 'https://control.msg91.com';
  private readonly templates: Record<string, string | undefined>;
  private readonly emailTemplates: Record<string, string | undefined>;
  private readonly devMode: boolean;
  constructor(private configService: ConfigService) {
    this.apiKey = configService.get('MSG91_API_KEY') || '';
    this.sender = configService.get('MSG91_WHATSAPP_SENDER') || '';
    this.devMode = !this.apiKey || this.apiKey === 'your-msg91-api-key';
    this.templates = {
      shipment_created: configService.get('MSG91_TEMPLATE_SHIPMENT_CREATED'),
      shipment_in_transit: configService.get(
        'MSG91_TEMPLATE_SHIPMENT_IN_TRANSIT',
      ),
      shipment_delivered: configService.get(
        'MSG91_TEMPLATE_SHIPMENT_DELIVERED',
      ),
      shipment_exception: configService.get(
        'MSG91_TEMPLATE_SHIPMENT_EXCEPTION',
      ),
      shipment_cancelled: configService.get(
        'MSG91_TEMPLATE_SHIPMENT_CANCELLED',
      ),
    };
    this.emailTemplates = {
      shipment_created: configService.get('MSG91_EMAIL_TEMPLATE_CREATED'),
      shipment_in_transit: configService.get('MSG91_EMAIL_TEMPLATE_IN_TRANSIT'),
      shipment_delivered: configService.get('MSG91_EMAIL_TEMPLATE_DELIVERED'),
      shipment_exception: configService.get('MSG91_EMAIL_TEMPLATE_EXCEPTION'),
      shipment_cancelled: configService.get('MSG91_EMAIL_TEMPLATE_CANCELLED'),
    };
    if (this.devMode) {
      this.logger.warn(
        '[DEV] MSG91 running in dev mode - messages logged to console',
      );
    }
  }
  private mapComponents(data: Record<string, any>) {
    return {
      body_1: data.recipientName
        ? { type: 'text', value: data.recipientName }
        : undefined,
      body_2:
        data.whiteLabelCode || data.trackingNumber
          ? { type: 'text', value: data.whiteLabelCode || data.trackingNumber }
          : undefined,
      body_3: data.destinationCountry
        ? { type: 'text', value: data.destinationCountry }
        : undefined,
      body_4: data.status ? { type: 'text', value: data.status } : undefined,
      body_5: data.location
        ? { type: 'text', value: data.location }
        : undefined,
      body_6: data.carrierCode
        ? { type: 'text', value: data.carrierCode.toUpperCase() }
        : undefined,
    };
  }
  private buildWhatsAppMessage(
    status: string,
    phone: string,
    data: Record<string, any>,
  ): string {
    const {
      recipientName,
      whiteLabelCode,
      trackingNumber,
      destinationCountry,
      status: currentStatus,
      location,
      carrierCode,
    } = data;
    const name = recipientName || 'Customer';
    const tracking = whiteLabelCode || trackingNumber || 'N/A';
    const destination = destinationCountry || 'N/A';
    const loc = location || 'N/A';
    const carrier = carrierCode?.toUpperCase() || 'N/A';
    const messages: Record<string, string> = {
      shipment_created: `Hi ${name}, your order has been created! Tracking Number: ${tracking} Destination: ${destination} Carrier: ${carrier}. We will notify you when there's an update.`,
      shipment_in_transit: `Hi ${name}, your order has shipped! Tracking Number: ${tracking} Destination: ${destination} Current Status: ${currentStatus} Location: ${loc}. We will continue to provide updates until delivery.`,
      shipment_delivered: `Hi ${name}, your order has been delivered! Tracking Number: ${tracking} Delivered To: ${destination} Status: ${currentStatus} Location: ${loc} Carrier: ${carrier}. Thank you for choosing us!`,
      shipment_exception: `Hi ${name}, there is an issue with your order. Tracking Number: ${tracking} Location: ${loc}. Please contact support for assistance.`,
      shipment_cancelled: `Hi ${name}, your order has been cancelled. Tracking Number: ${tracking}. If you have questions, contact support.`,
    };
    return `[MSG91 WhatsApp] To: ${phone}\n${messages[status] || status}`;
  }
  private buildEmailMessage(
    status: string,
    to: string,
    data: Record<string, any>,
  ): string {
    return `[MSG91 Email] To: ${to}\nStatus: ${status}\nData: ${JSON.stringify(data)}`;
  }
  async sendWhatsApp(
    phone: string,
    status: string,
    data: Record<string, any>,
  ): Promise<MSG91Response> {
    const template = this.templates[status];
    if (this.devMode) {
      this.logger.log(this.buildWhatsAppMessage(status, phone, data));
      return { success: true, request_id: 'dev-' + Date.now() };
    }
    if (!template) return { success: false, error: `No template: ${status}` };
    if (!this.apiKey) return { success: false, error: 'API_KEY not set' };
    try {
      const res = await fetch(
        `${this.baseUrl}/api/v5/whatsapp/whatsapp-outbound-message/bulk/`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            authkey: this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            integrated_number: this.sender,
            content_type: 'template',
            payload: {
              type: 'template',
              template: {
                name: template,
                language: { code: 'en', policy: 'deterministic' },
                to_and_components: [
                  {
                    to: [phone.replace(/^\+/, '')],
                    components: this.mapComponents(data),
                  },
                ],
              },
              messaging_product: 'whatsapp',
            },
          }),
        },
      );
      const result = (await res.json()) as MSG91Response;
      if (res.ok && result.success) {
        this.logger.log(`WhatsApp sent: ${phone}`);
        return { success: true, request_id: result.request_id };
      }
      this.logger.error(`WhatsApp failed: ${result.error}`);
      return { success: false, error: result.error };
    } catch (e) {
      this.logger.error(`WhatsApp error: ${e}`);
      return { success: false, error: String(e) };
    }
  }
  async sendEmail(
    to: string,
    _toName: string,
    status: string,
    data: Record<string, any>,
  ): Promise<MSG91Response> {
    const template = this.emailTemplates[status];
    if (this.devMode) {
      this.logger.log(this.buildEmailMessage(status, to, data));
      return { success: true, request_id: 'dev-' + Date.now() };
    }
    if (!template) return { success: false, error: `No template: ${status}` };
    if (!this.apiKey) return { success: false, error: 'API_KEY not set' };
    try {
      const res = await fetch(`${this.baseUrl}/api/v5/email/send`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          authkey: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: [{ to: [{ name: _toName, email: to }], variables: data }],
          from: {
            name: this.configService.get('APP_NAME') || 'GT Express',
            email: this.configService.get('SMTP_FROM') || 'noreply@track.com',
          },
          template_id: template,
        }),
      });
      const result = (await res.json()) as MSG91Response;
      if (res.ok && result.success) {
        this.logger.log(`Email sent: ${to}`);
        return { success: true, request_id: result.request_id };
      }
      this.logger.error(`Email failed: ${result.error}`);
      return { success: false, error: result.error };
    } catch (e) {
      this.logger.error(`Email error: ${e}`);
      return { success: false, error: String(e) };
    }
  }
}
