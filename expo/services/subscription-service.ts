// GraphQL Subscription & Premium Features Service
// Provides subscription, AI replies, streaks, and push notification APIs

import { graphqlClient } from "./graphql-client";
import { gql } from "urql";

// ============= Types =============

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
  is_active: boolean;
  sort_order: number;
}

export interface SubscriptionFeatures {
  unlimited_likes: boolean;
  see_who_liked: boolean;
  advanced_filters: boolean;
  priority_matching: boolean;
  read_receipts: boolean;
  profile_boost: boolean;
  undo_swipe: boolean;
  ai_replies: boolean;
  incognito_mode: boolean;
  no_ads: boolean;
}

export interface SubscriptionLimits {
  swipes_per_day: number;
  ai_replies_per_day: number;
  superlikes_per_day: number;
  boosts_per_month: number;
}

export interface UserSubscriptionStatus {
  plan_id: string;
  plan: SubscriptionPlan;
  is_subscribed: boolean;
  limits: SubscriptionLimits;
  features: SubscriptionFeatures;
  swipes_remaining: number;
  ai_replies_remaining: number;
}

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
  provider: string;
}

export interface AIReply {
  id: string;
  text: string;
  tone: string;
}

export interface AIReplyResponse {
  replies: AIReply[];
  remaining_today: number;
}

export interface AIUsageStatus {
  can_use: boolean;
  remaining_today: number;
  resets_at: string;
}

export interface MatchStreak {
  id: string;
  match_id: string;
  current_streak: number;
  longest_streak: number;
  last_message_date: string;
  streak_start_date: string;
  is_at_risk: boolean;
  hours_remaining: number | null;
}

export interface UserStreakStats {
  total_active_streaks: number;
  longest_streak_ever: number;
  current_milestones: StreakMilestone[];
}

export interface StreakMilestone {
  days: number;
  emoji: string;
  title: string;
}

export interface PushNotificationResult {
  success: boolean;
  message: string;
}

// ============= GraphQL Documents =============

// Subscription Queries
const GET_SUBSCRIPTION_PLANS = gql`
  query GetSubscriptionPlans {
    subscriptionPlans {
      id
      name
      description
      price_monthly
      price_yearly
      features {
        unlimited_likes
        see_who_liked
        advanced_filters
        priority_matching
        read_receipts
        profile_boost
        undo_swipe
        ai_replies
        incognito_mode
        no_ads
      }
      limits {
        swipes_per_day
        ai_replies_per_day
        superlikes_per_day
        boosts_per_month
      }
      is_active
      sort_order
    }
  }
`;

const GET_MY_SUBSCRIPTION = gql`
  query GetMySubscription {
    mySubscription {
      plan_id
      plan {
        id
        name
        description
        price_monthly
        price_yearly
      }
      is_subscribed
      limits {
        swipes_per_day
        ai_replies_per_day
        superlikes_per_day
        boosts_per_month
      }
      features {
        unlimited_likes
        see_who_liked
        advanced_filters
        priority_matching
        read_receipts
        profile_boost
        undo_swipe
        ai_replies
        incognito_mode
        no_ads
      }
      swipes_remaining
      ai_replies_remaining
    }
  }
`;

const CAN_PERFORM_ACTION = gql`
  query CanPerformAction($action: String!) {
    canPerformAction(action: $action)
  }
`;

// Subscription Mutations
const CREATE_CHECKOUT_SESSION = gql`
  mutation CreateCheckoutSession($planId: String!, $billingPeriod: String!) {
    createCheckoutSession(planId: $planId, billingPeriod: $billingPeriod) {
      checkout_url
      session_id
      provider
    }
  }
`;

const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription {
    cancelSubscription
  }
`;

const REACTIVATE_SUBSCRIPTION = gql`
  mutation ReactivateSubscription {
    reactivateSubscription
  }
`;

const SYNC_SUBSCRIPTION_STATUS = gql`
  mutation SyncSubscriptionStatus {
    syncSubscriptionStatus {
      plan_id
      is_subscribed
      swipes_remaining
      ai_replies_remaining
    }
  }
`;

// AI Replies
const GENERATE_AI_REPLIES = gql`
  mutation GenerateAIReplies($input: GenerateAIRepliesInput!) {
    generateAIReplies(input: $input) {
      replies {
        id
        text
        tone
      }
      remaining_today
    }
  }
`;

const GET_AI_USAGE_STATUS = gql`
  query GetAIUsageStatus {
    aiUsageStatus {
      can_use
      remaining_today
      resets_at
    }
  }
`;

// Streaks
const GET_MATCH_STREAK = gql`
  query GetMatchStreak($matchId: String!) {
    matchStreak(matchId: $matchId) {
      id
      match_id
      current_streak
      longest_streak
      last_message_date
      streak_start_date
      is_at_risk
      hours_remaining
    }
  }
`;

const GET_MY_STREAKS = gql`
  query GetMyStreaks {
    myStreaks {
      id
      match_id
      current_streak
      longest_streak
      is_at_risk
      hours_remaining
    }
  }
`;

const GET_MY_STREAK_STATS = gql`
  query GetMyStreakStats {
    myStreakStats {
      total_active_streaks
      longest_streak_ever
      current_milestones {
        days
        emoji
        title
      }
    }
  }
`;

// Push Notifications
const REGISTER_PUSH_TOKEN = gql`
  mutation RegisterPushToken($input: RegisterPushTokenInput!) {
    registerPushToken(input: $input) {
      success
      message
    }
  }
`;

const REMOVE_PUSH_TOKEN = gql`
  mutation RemovePushToken($token: String!) {
    removePushToken(token: $token) {
      success
      message
    }
  }
`;

// ============= Service Functions =============

class SubscriptionService {
  // Subscription Plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const result = await graphqlClient
      .query(GET_SUBSCRIPTION_PLANS, {})
      .toPromise();

    if (result.error) {
      console.error("[SubscriptionService] Get plans error:", result.error);
      throw new Error(result.error.message);
    }

    return result.data?.subscriptionPlans || [];
  }

  async getMySubscription(): Promise<UserSubscriptionStatus | null> {
    const result = await graphqlClient
      .query(GET_MY_SUBSCRIPTION, {})
      .toPromise();

    if (result.error) {
      console.error("[SubscriptionService] Get subscription error:", result.error);
      throw new Error(result.error.message);
    }

    return result.data?.mySubscription || null;
  }

  async canPerformAction(action: string): Promise<boolean> {
    const result = await graphqlClient
      .query(CAN_PERFORM_ACTION, { action })
      .toPromise();

    if (result.error) {
      console.error("[SubscriptionService] Can perform action error:", result.error);
      return false;
    }

    return result.data?.canPerformAction || false;
  }

  async createCheckoutSession(planId: string, billingPeriod: "monthly" | "yearly"): Promise<CheckoutSession> {
    const result = await graphqlClient
      .mutation(CREATE_CHECKOUT_SESSION, { planId, billingPeriod })
      .toPromise();

    if (result.error) {
      console.error("[SubscriptionService] Create checkout error:", result.error);
      throw new Error(result.error.message);
    }

    return result.data?.createCheckoutSession;
  }

  async cancelSubscription(): Promise<boolean> {
    const result = await graphqlClient
      .mutation(CANCEL_SUBSCRIPTION, {})
      .toPromise();

    if (result.error) {
      console.error("[SubscriptionService] Cancel error:", result.error);
      throw new Error(result.error.message);
    }

    return result.data?.cancelSubscription || false;
  }

  async reactivateSubscription(): Promise<boolean> {
    const result = await graphqlClient
      .mutation(REACTIVATE_SUBSCRIPTION, {})
      .toPromise();

    if (result.error) {
      console.error("[SubscriptionService] Reactivate error:", result.error);
      throw new Error(result.error.message);
    }

    return result.data?.reactivateSubscription || false;
  }

  async syncStatus(): Promise<UserSubscriptionStatus | null> {
    const result = await graphqlClient
      .mutation(SYNC_SUBSCRIPTION_STATUS, {})
      .toPromise();

    if (result.error) {
      console.error("[SubscriptionService] Sync error:", result.error);
      return null;
    }

    return result.data?.syncSubscriptionStatus || null;
  }
}

class AIRepliesService {
  async generateReplies(
    chatId: string,
    contextMessages?: number,
    tone?: string
  ): Promise<AIReplyResponse> {
    const result = await graphqlClient
      .mutation(GENERATE_AI_REPLIES, {
        input: {
          chat_id: chatId,
          context_messages: contextMessages,
          tone,
        },
      })
      .toPromise();

    if (result.error) {
      console.error("[AIRepliesService] Generate error:", result.error);
      throw new Error(result.error.message);
    }

    return result.data?.generateAIReplies || { replies: [], remaining_today: 0 };
  }

  async getUsageStatus(): Promise<AIUsageStatus> {
    const result = await graphqlClient
      .query(GET_AI_USAGE_STATUS, {})
      .toPromise();

    if (result.error) {
      console.error("[AIRepliesService] Usage status error:", result.error);
      throw new Error(result.error.message);
    }

    return result.data?.aiUsageStatus || { can_use: false, remaining_today: 0, resets_at: "" };
  }
}

class StreaksService {
  async getMatchStreak(matchId: string): Promise<MatchStreak | null> {
    const result = await graphqlClient
      .query(GET_MATCH_STREAK, { matchId })
      .toPromise();

    if (result.error) {
      console.error("[StreaksService] Get streak error:", result.error);
      return null;
    }

    return result.data?.matchStreak || null;
  }

  async getMyStreaks(): Promise<MatchStreak[]> {
    const result = await graphqlClient
      .query(GET_MY_STREAKS, {})
      .toPromise();

    if (result.error) {
      console.error("[StreaksService] Get my streaks error:", result.error);
      return [];
    }

    return result.data?.myStreaks || [];
  }

  async getMyStats(): Promise<UserStreakStats | null> {
    const result = await graphqlClient
      .query(GET_MY_STREAK_STATS, {})
      .toPromise();

    if (result.error) {
      console.error("[StreaksService] Get stats error:", result.error);
      return null;
    }

    return result.data?.myStreakStats || null;
  }
}

class PushNotificationService {
  async registerToken(
    token: string,
    platform: "ios" | "android" | "web",
    deviceId?: string
  ): Promise<PushNotificationResult> {
    const result = await graphqlClient
      .mutation(REGISTER_PUSH_TOKEN, {
        input: {
          token,
          platform,
          device_id: deviceId,
        },
      })
      .toPromise();

    if (result.error) {
      console.error("[PushNotificationService] Register error:", result.error);
      throw new Error(result.error.message);
    }

    return result.data?.registerPushToken || { success: false, message: "Unknown error" };
  }

  async removeToken(token: string): Promise<PushNotificationResult> {
    const result = await graphqlClient
      .mutation(REMOVE_PUSH_TOKEN, { token })
      .toPromise();

    if (result.error) {
      console.error("[PushNotificationService] Remove error:", result.error);
      throw new Error(result.error.message);
    }

    return result.data?.removePushToken || { success: false, message: "Unknown error" };
  }
}

// Export singleton instances
export const subscriptionService = new SubscriptionService();
export const aiRepliesService = new AIRepliesService();
export const streaksService = new StreaksService();
export const pushNotificationService = new PushNotificationService();
