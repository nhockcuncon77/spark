// Push Notification Service
// Handles push notification permissions, token registration, and notification handling

import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { pushNotificationService } from "./subscription-service";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification types from backend
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

// Notification channel IDs (Android)
export const NotificationChannels = {
  MESSAGES: "messages",
  MATCHES: "matches",
  STREAKS: "streaks",
  ACTIVITIES: "activities",
  ANNOUNCEMENTS: "announcements",
};

class PushNotificationManager {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private onNotificationReceived: ((data: NotificationData) => void) | null = null;
  private onNotificationResponse: ((data: NotificationData) => void) | null = null;

  // Initialize push notifications
  async initialize(): Promise<string | null> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log("[PushNotifications] Permission denied");
        return null;
      }

      // Set up notification channels (Android)
      await this.setupChannels();

      // Get push token
      const token = await this.getExpoPushToken();
      if (!token) {
        console.log("[PushNotifications] Failed to get push token");
        return null;
      }

      this.expoPushToken = token;

      // Register with backend
      await this.registerWithBackend(token);

      // Set up listeners
      this.setupListeners();

      console.log("[PushNotifications] Initialized with token:", token.substring(0, 20) + "...");
      return token;
    } catch (error) {
      console.error("[PushNotifications] Initialization error:", error);
      return null;
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log("[PushNotifications] Must use physical device for push notifications");
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[PushNotifications] Permission not granted");
      return false;
    }

    return true;
  }

  // Set up Android notification channels
  private async setupChannels(): Promise<void> {
    if (Platform.OS !== "android") return;

    await Notifications.setNotificationChannelAsync(NotificationChannels.MESSAGES, {
      name: "Messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7C3AED",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync(NotificationChannels.MATCHES, {
      name: "Matches",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#22C55E",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync(NotificationChannels.STREAKS, {
      name: "Streaks",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#F59E0B",
    });

    await Notifications.setNotificationChannelAsync(NotificationChannels.ACTIVITIES, {
      name: "Activity",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#38BDF8",
    });

    await Notifications.setNotificationChannelAsync(NotificationChannels.ANNOUNCEMENTS, {
      name: "Announcements",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Get Expo push token
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.log("[PushNotifications] No project ID found, using development token");
        // For development, use device push token instead
        const token = await Notifications.getDevicePushTokenAsync();
        return token.data;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.error("[PushNotifications] Error getting push token:", error);
      return null;
    }
  }

  // Register token with backend
  private async registerWithBackend(token: string): Promise<void> {
    try {
      const platform = Platform.OS as "ios" | "android" | "web";
      const deviceId = Constants.deviceId || undefined;

      const result = await pushNotificationService.registerToken(token, platform, deviceId);

      if (result.success) {
        console.log("[PushNotifications] Token registered with backend");
      } else {
        console.error("[PushNotifications] Backend registration failed:", result.message);
      }
    } catch (error) {
      console.error("[PushNotifications] Backend registration error:", error);
    }
  }

  // Set up notification listeners
  private setupListeners(): void {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as NotificationData;
      console.log("[PushNotifications] Received:", data);

      if (this.onNotificationReceived) {
        this.onNotificationReceived(data);
      }
    });

    // Handle notification interactions (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      console.log("[PushNotifications] Tapped:", data);

      if (this.onNotificationResponse) {
        this.onNotificationResponse(data);
      }
    });
  }

  // Set callback for when notification is received
  setOnNotificationReceived(callback: (data: NotificationData) => void): void {
    this.onNotificationReceived = callback;
  }

  // Set callback for when notification is tapped
  setOnNotificationResponse(callback: (data: NotificationData) => void): void {
    this.onNotificationResponse = callback;
  }

  // Get current push token
  getToken(): string | null {
    return this.expoPushToken;
  }

  // Update badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("[PushNotifications] Error setting badge:", error);
    }
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // Schedule local notification (for testing or reminders)
  async scheduleLocalNotification(
    title: string,
    body: string,
    data: NotificationData,
    secondsFromNow: number = 1
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
      },
    });
    return id;
  }

  // Cancel scheduled notification
  async cancelNotification(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Dismiss all notifications from notification center
  async dismissAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  // Remove token from backend (on logout)
  async unregister(): Promise<void> {
    if (this.expoPushToken) {
      try {
        await pushNotificationService.removeToken(this.expoPushToken);
        console.log("[PushNotifications] Token unregistered");
      } catch (error) {
        console.error("[PushNotifications] Unregister error:", error);
      }
    }

    // Clean up listeners
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }

    this.expoPushToken = null;
  }

  // Clean up on unmount
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager();

// Hook for using push notifications in components
import { useEffect, useCallback } from "react";
import { useRouter } from "expo-router";

export function usePushNotifications() {
  const router = useRouter();

  const handleNotificationResponse = useCallback((data: NotificationData) => {
    // Navigate based on notification type
    switch (data.type) {
      case "new_message":
        if (data.chat_id) {
          router.push(`/chat/${data.chat_id}`);
        }
        break;
      case "new_match":
        router.push("/(tabs)/chat");
        break;
      case "photo_unlocked":
        if (data.match_id) {
          router.push(`/modal/reveal?matchId=${data.match_id}`);
        }
        break;
      case "profile_view":
      case "poke":
        if (data.user_id) {
          router.push(`/user/${data.user_id}`);
        }
        break;
      case "streak_milestone":
      case "streak_at_risk":
        if (data.chat_id) {
          router.push(`/chat/${data.chat_id}`);
        }
        break;
      default:
        break;
    }
  }, [router]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    pushNotificationManager.initialize();
    pushNotificationManager.setOnNotificationResponse(handleNotificationResponse);
    return () => {
      pushNotificationManager.cleanup();
    };
  }, [handleNotificationResponse]);

  return {
    getToken: () => pushNotificationManager.getToken(),
    setBadgeCount: pushNotificationManager.setBadgeCount.bind(pushNotificationManager),
    clearBadge: pushNotificationManager.clearBadge.bind(pushNotificationManager),
  };
}
