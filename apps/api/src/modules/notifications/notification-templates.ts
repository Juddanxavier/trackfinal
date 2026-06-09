export interface NotificationTemplate {
  subject: string;
  title: string;
  body: string;
  smsTemplate?: string;
  whatsappTemplate?: string;
}

export const notificationTemplates: Record<string, NotificationTemplate> = {
  'shipment.created': {
    subject: 'Your Shipment Has Been Created - {{orgName}}',
    title: 'Shipment Created',
    body: `Your shipment has been created.\n\nTracking: {{whiteLabelCode}}\nDestination: {{destinationCountry}}\nTrack: {{trackingUrl}}`,
    smsTemplate: 'Shipment created. Track: {{whiteLabelCode}}',
    whatsappTemplate:
      '📦 *Shipment Created*\n\nTrack: {{whiteLabelCode}}\nTo: {{destinationCountry}}\n🔗 {{trackingUrl}}',
  },
  'shipment.in_transit': {
    subject: 'Your Shipment Is In Transit - {{orgName}}',
    title: 'Shipment In Transit',
    body: `Your shipment is now in transit.\n\nTracking: {{whiteLabelCode}}\nStatus: In Transit\nLocation: {{location}}\nTrack: {{trackingUrl}}`,
    smsTemplate: 'Shipment in transit. Track: {{whiteLabelCode}}',
    whatsappTemplate:
      '🚚 *In Transit*\n\nTrack: {{whiteLabelCode}}\nLocation: {{location}}\n🔗 {{trackingUrl}}',
  },
  'shipment.out_for_delivery': {
    subject: 'Your Shipment Is Out For Delivery - {{orgName}}',
    title: 'Out For Delivery',
    body: `Your shipment is out for delivery!\n\nTracking: {{whiteLabelCode}}\nTrack: {{trackingUrl}}`,
    smsTemplate: 'Out for delivery! Track: {{whiteLabelCode}}',
    whatsappTemplate:
      '🚚 *Out For Delivery*\n\nTrack: {{whiteLabelCode}}\n🔗 {{trackingUrl}}',
  },
  'shipment.delivered': {
    subject: 'Your Shipment Has Been Delivered - {{orgName}}',
    title: 'Shipment Delivered',
    body: `Your shipment has been delivered!\n\nTracking: {{whiteLabelCode}}\nDelivered to: {{destinationCountry}}`,
    smsTemplate: 'Delivered! Track: {{whiteLabelCode}}',
    whatsappTemplate:
      '✅ *Delivered*\n\nTrack: {{whiteLabelCode}}\nTo: {{destinationCountry}}\nThank you!',
  },
  'shipment.exception': {
    subject: 'Delivery Exception - Action Required - {{orgName}}',
    title: 'Delivery Exception',
    body: `There's an issue with your shipment.\n\nTracking: {{whiteLabelCode}}\nReason: {{exceptionReason}}\n\nPlease contact support.`,
    smsTemplate: 'Delivery issue. Track: {{whiteLabelCode}}',
    whatsappTemplate:
      '⚠️ *Exception*\n\nTrack: {{whiteLabelCode}}\nReason: {{exceptionReason}}\nContact support for help.',
  },
  'shipment.pending': {
    subject: 'Shipment Pending - {{orgName}}',
    title: 'Pending',
    body: `Your shipment is pending.\n\nTracking: {{whiteLabelCode}}`,
    smsTemplate: 'Pending. Track: {{whiteLabelCode}}',
    whatsappTemplate: '⏳ *Pending*\n\nTrack: {{whiteLabelCode}}',
  },
  'quote.assigned': {
    subject: 'You Have Been Assigned a Quote - {{orgName}}',
    title: 'Quote Assigned',
    body: `A new quote has been assigned to you.\n\nQuote ID: {{quoteId}}\nFrom: {{originCountry}}\nTo: {{destinationCountry}}\nWeight: {{weight}}kg`,
    smsTemplate: 'New quote assigned: {{quoteId}}',
    whatsappTemplate:
      '📋 *Quote Assigned*\n\nQuote: {{quoteId}}\nRoute: {{originCountry}} → {{destinationCountry}}',
  },
  'quote.status_updated': {
    subject: 'Quote Status Updated - {{orgName}}',
    title: 'Quote Status Updated',
    body: `Your quote status has been updated.\n\nQuote ID: {{quoteId}}\nStatus: {{status}}`,
    smsTemplate: 'Quote {{quoteId}} status: {{status}}',
    whatsappTemplate:
      '📋 *Quote Updated*\n\nQuote: {{quoteId}}\nStatus: {{status}}',
  },
  'shipment.customs': {
    subject: 'Customs Update - {{orgName}}',
    title: 'Customs Clearance',
    body: `Your shipment is going through customs.\n\nTracking: {{whiteLabelCode}}\nDestination: {{destinationCountry}}`,
    smsTemplate: 'At customs. Track: {{whiteLabelCode}}',
    whatsappTemplate:
      '🛃 *Customs Update*\n\nTrack: {{whiteLabelCode}}\nStatus: At customs',
  },
};

export function getTemplate(
  titleKey: string,
): NotificationTemplate | undefined {
  return notificationTemplates[titleKey];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseTemplate(
  template: string,
  data: Record<string, any>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.split(`{{${key}}}`).join(String(value ?? ''));
  }
  return result;
}
