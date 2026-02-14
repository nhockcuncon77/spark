/**
 * Web stub for push notifications. expo-notifications is native-only;
 * this file is used when building for web so the app doesn't import it.
 */

export type NotificationType =
  | "new_match"
  | "new_message"
  | "message_seen"
  | "photo_unlocked"
  | "streak_milestone"
  | "streak_at_risk"
  | "profile_view"
  | "poke"
  | "announcement";

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  match_id?: string;
  chat_id?: string;
  user_id?: string;
  streak_count?: number;
}

export const NotificationChannels = {
  MESSAGES: "messages",
  MATCHES: "matches",
  STREAKS: "streaks",
  ACTIVITIES: "activities",
  ANNOUNCEMENTS: "announcements",
};

const noop = (): void => {};
const noopAsync = async (): Promise<void> => {};
const noopReturnNull = (): null => null;

const pushNotificationManager = {
  initialize: (): Promise<null> => Promise.resolve(null),
  requestPermissions: (): Promise<boolean> => Promise.resolve(false),
  getToken: noopReturnNull,
  setOnNotificationResponse: noop,
  setBadgeCount: noopAsync,
  clearBadge: noopAsync,
  cleanup: noop,
  unregister: noopAsync,
};

export { pushNotificationManager };

export function usePushNotifications() {
  return {
    getToken: noopReturnNull,
    setBadgeCount: noopAsync,
    clearBadge: noopAsync,
  };
}
