export interface NotificationPayload {
  organisationId: string;
  userId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  titleKey: string;
  data: Record<string, any>;
  shipmentId?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: string;
  messageId?: string;
  error?: string;
}

export interface NotificationChannel {
  readonly channelName: string;
  send(payload: NotificationPayload): Promise<NotificationResult>;
  canSend(payload: NotificationPayload): boolean;
}
