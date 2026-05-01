import {
  notificationPreferences,
  notificationLogs,
} from '../../database/schema';

export type NotificationPreference =
  typeof notificationPreferences.$inferSelect;
export type NotificationLog = typeof notificationLogs.$inferSelect;
