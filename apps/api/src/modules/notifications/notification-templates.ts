export interface NotificationTemplate {
  subject: string;
  title: string;
  body: string;
  smsTemplate?: string;
  whatsappTemplate?: string;
}

export const notificationTemplates: Record<string, NotificationTemplate> = {
  'shipment.created': {
    subject: 'Your Shipment Has Been Created',
    title: 'Shipment Created',
    body: `Your shipment {{trackingNumber}} has been created.\n\nCarrier: {{carrierCode}}\nFrom: {{originCountry}}\nTo: {{destinationCountry}}`,
    smsTemplate: 'Shipment {{trackingNumber}} created. Carrier: {{carrierCode}}',
    whatsappTemplate: '📦 *Shipment Created*\n\nTracking: {{trackingNumber}}\nCarrier: {{carrierCode}}\nFrom: {{originCountry}}\nTo: {{destinationCountry}}',
  },
  'shipment.in_transit': {
    subject: 'Your Shipment Is In Transit',
    title: 'Shipment In Transit',
    body: `Your shipment {{trackingNumber}} is now in transit.\n\nCurrent Status: In Transit\nCarrier: {{carrierCode}}\nDestination: {{destinationCountry}}`,
    smsTemplate: 'Shipment {{trackingNumber}} is in transit. Track: {{whiteLabelCode}}',
    whatsappTemplate: '🚚 *Shipment In Transit*\n\nTracking: {{trackingNumber}}\nCarrier: {{carrierCode}}\nDestination: {{destinationCountry}}',
  },
  'shipment.out_for_delivery': {
    subject: 'Your Shipment Is Out For Delivery',
    title: 'Out For Delivery',
    body: `Your shipment {{trackingNumber}} is out for delivery!\n\nTrack: {{whiteLabelCode}}`,
    smsTemplate: 'Shipment {{trackingNumber}} out for delivery!',
    whatsappTemplate: '🚚 *Out For Delivery*\n\nTracking: {{trackingNumber}}\nDestination: {{destinationCountry}}',
  },
  'shipment.delivered': {
    subject: 'Your Shipment Has Been Delivered',
    title: 'Shipment Delivered',
    body: `Your shipment {{trackingNumber}} has been delivered!\n\nDelivered to: {{recipientName}}\nDestination: {{destinationCountry}}`,
    smsTemplate: 'Shipment {{trackingNumber}} delivered!',
    whatsappTemplate: '✅ *Delivered*\n\nTracking: {{trackingNumber}}\nDelivered to: {{recipientName}}\nLocation: {{destinationCountry}}',
  },
  'shipment.exception': {
    subject: 'Delivery Exception - Action Required',
    title: 'Delivery Exception',
    body: `There's an issue with your shipment {{trackingNumber}}.\n\nStatus: Exception\nReason: {{exceptionReason}}\n\nPlease contact support for assistance.`,
    smsTemplate: 'Shipment {{trackingNumber}} has an issue. Contact support.',
    whatsappTemplate: '⚠️ *Delivery Exception*\n\nTracking: {{trackingNumber}}\nReason: {{exceptionReason}}',
  },
  'shipment.pending': {
    subject: 'Shipment Pending',
    title: 'Pending',
    body: `Your shipment {{trackingNumber}} is pending.\n\nCarrier: {{carrierCode}}`,
    smsTemplate: 'Shipment {{trackingNumber}} pending',
    whatsappTemplate: '⏳ *Pending*\n\nTracking: {{trackingNumber}}',
  },
  'quote.assigned': {
    subject: 'You Have Been Assigned a Quote',
    title: 'Quote Assigned',
    body: `A new quote has been assigned to you.\n\nQuote ID: {{quoteId}}\nFrom: {{originCountry}}\nTo: {{destinationCountry}}\nWeight: {{weight}}kg`,
    smsTemplate: 'New quote assigned: {{quoteId}}',
    whatsappTemplate: '📋 *Quote Assigned*\n\nQuote ID: {{quoteId}}\nRoute: {{originCountry}} → {{destinationCountry}}',
  },
  'quote.status_updated': {
    subject: 'Quote Status Updated',
    title: 'Quote Status Updated',
    body: `Your quote status has been updated.\n\nQuote ID: {{quoteId}}\nStatus: {{status}}`,
    smsTemplate: 'Quote {{quoteId}} status: {{status}}',
    whatsappTemplate: '📋 *Quote Updated*\n\nQuote ID: {{quoteId}}\nStatus: {{status}}',
  },
  'shipment.customs': {
    subject: 'Customs Update',
    title: 'Customs Clearance',
    body: `Your shipment {{trackingNumber}} is going through customs.\n\nDestination: {{destinationCountry}}`,
    smsTemplate: 'Shipment {{trackingNumber}} at customs',
    whatsappTemplate: '🛃 *Customs Update*\n\nTracking: {{trackingNumber}}\nStatus: At customs',
  },
};

export function getTemplate(titleKey: string): NotificationTemplate | undefined {
  return notificationTemplates[titleKey];
}

export function parseTemplate(
  template: string,
  data: Record<string, any>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
  }
  return result;
}