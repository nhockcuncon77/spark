// Subscription Store
// Manages subscription status, plans, and premium feature gates

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  subscriptionService,
  SubscriptionPlan,
  UserSubscriptionStatus,
  SubscriptionFeatures,
  SubscriptionLimits,
} from "@/services/subscription-service";

// Default free tier limits
const DEFAULT_LIMITS: SubscriptionLimits = {
  swipes_per_day: 25,
  ai_replies_per_day: 3,
  superlikes_per_day: 1,
  boosts_per_month: 0,
};

// Default free tier features
const DEFAULT_FEATURES: SubscriptionFeatures = {
  unlimited_likes: false,
  see_who_liked: false,
  advanced_filters: false,
  priority_matching: false,
  read_receipts: false,
  profile_boost: false,
  undo_swipe: false,
  ai_replies: true, // Free users get limited AI replies
  incognito_mode: false,
  no_ads: false,
};

interface SubscriptionState {
  // Subscription data
  plans: SubscriptionPlan[];
  currentPlanId: string;
  isSubscribed: boolean;
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;

  // Usage tracking
  swipesRemaining: number;
  aiRepliesRemaining: number;
  superlikesRemaining: number;
  boostsRemaining: number;

  // Loading states
  isLoading: boolean;
  isLoadingPlans: boolean;
  error: string | null;

  // Actions
  fetchPlans: () => Promise<void>;
  fetchSubscriptionStatus: () => Promise<void>;
  syncStatus: () => Promise<void>;
  checkout: (planId: string, billingPeriod: "monthly" | "yearly") => Promise<string>;
  cancelSubscription: () => Promise<boolean>;
  reactivateSubscription: () => Promise<boolean>;

  // Usage tracking
  decrementSwipes: () => void;
  decrementAIReplies: () => void;
  decrementSuperlikes: () => void;
  decrementBoosts: () => void;
  resetDailyLimits: () => void;

  // Feature gates
  canSwipe: () => boolean;
  canUseAIReplies: () => boolean;
  canSuperlike: () => boolean;
  canBoost: () => boolean;
  hasFeature: (feature: keyof SubscriptionFeatures) => boolean;

  // Helpers
  getPlanById: (planId: string) => SubscriptionPlan | undefined;
  getCurrentPlan: () => SubscriptionPlan | undefined;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      plans: [],
      currentPlanId: "free",
      isSubscribed: false,
      features: DEFAULT_FEATURES,
      limits: DEFAULT_LIMITS,
      swipesRemaining: DEFAULT_LIMITS.swipes_per_day,
      aiRepliesRemaining: DEFAULT_LIMITS.ai_replies_per_day,
      superlikesRemaining: DEFAULT_LIMITS.superlikes_per_day,
      boostsRemaining: DEFAULT_LIMITS.boosts_per_month,
      isLoading: false,
      isLoadingPlans: false,
      error: null,

      // Fetch subscription plans
      fetchPlans: async () => {
        set({ isLoadingPlans: true, error: null });
        try {
          const plans = await subscriptionService.getPlans();
          set({ plans, isLoadingPlans: false });
        } catch (error: any) {
          console.error("[SubscriptionStore] Fetch plans error:", error);
          set({ error: error.message, isLoadingPlans: false });
        }
      },

      // Fetch current subscription status
      fetchSubscriptionStatus: async () => {
        set({ isLoading: true, error: null });
        try {
          const status = await subscriptionService.getMySubscription();
          if (status) {
            set({
              currentPlanId: status.plan_id,
              isSubscribed: status.is_subscribed,
              features: status.features,
              limits: status.limits,
              swipesRemaining: status.swipes_remaining,
              aiRepliesRemaining: status.ai_replies_remaining,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error: any) {
          console.error("[SubscriptionStore] Fetch status error:", error);
          set({ error: error.message, isLoading: false });
        }
      },

      // Sync status with server
      syncStatus: async () => {
        try {
          const status = await subscriptionService.syncStatus();
          if (status) {
            set({
              currentPlanId: status.plan_id,
              isSubscribed: status.is_subscribed,
              swipesRemaining: status.swipes_remaining,
              aiRepliesRemaining: status.ai_replies_remaining,
            });
          }
        } catch (error) {
          console.error("[SubscriptionStore] Sync error:", error);
        }
      },

      // Start checkout flow
      checkout: async (planId: string, billingPeriod: "monthly" | "yearly") => {
        set({ isLoading: true, error: null });
        try {
          const session = await subscriptionService.createCheckoutSession(planId, billingPeriod);
          set({ isLoading: false });
          return session.checkout_url;
        } catch (error: any) {
          console.error("[SubscriptionStore] Checkout error:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Cancel subscription
      cancelSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const success = await subscriptionService.cancelSubscription();
          if (success) {
            // Will still have access until period ends
            set({ isLoading: false });
          }
          return success;
        } catch (error: any) {
          console.error("[SubscriptionStore] Cancel error:", error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Reactivate subscription
      reactivateSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const success = await subscriptionService.reactivateSubscription();
          if (success) {
            await get().fetchSubscriptionStatus();
          }
          set({ isLoading: false });
          return success;
        } catch (error: any) {
          console.error("[SubscriptionStore] Reactivate error:", error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Usage tracking
      decrementSwipes: () => {
        const { swipesRemaining, features } = get();
        if (!features.unlimited_likes && swipesRemaining > 0) {
          set({ swipesRemaining: swipesRemaining - 1 });
        }
      },

      decrementAIReplies: () => {
        const { aiRepliesRemaining, limits } = get();
        // -1 means unlimited
        if (limits.ai_replies_per_day !== -1 && aiRepliesRemaining > 0) {
          set({ aiRepliesRemaining: aiRepliesRemaining - 1 });
        }
      },

      decrementSuperlikes: () => {
        const { superlikesRemaining } = get();
        if (superlikesRemaining > 0) {
          set({ superlikesRemaining: superlikesRemaining - 1 });
        }
      },

      decrementBoosts: () => {
        const { boostsRemaining } = get();
        if (boostsRemaining > 0) {
          set({ boostsRemaining: boostsRemaining - 1 });
        }
      },

      resetDailyLimits: () => {
        const { limits } = get();
        set({
          swipesRemaining: limits.swipes_per_day,
          aiRepliesRemaining: limits.ai_replies_per_day,
          superlikesRemaining: limits.superlikes_per_day,
        });
      },

      // Feature gates
      canSwipe: () => {
        const { features, swipesRemaining } = get();
        return features.unlimited_likes || swipesRemaining > 0;
      },

      canUseAIReplies: () => {
        const { features, aiRepliesRemaining, limits } = get();
        if (!features.ai_replies) return false;
        if (limits.ai_replies_per_day === -1) return true; // Unlimited
        return aiRepliesRemaining > 0;
      },

      canSuperlike: () => {
        const { superlikesRemaining } = get();
        return superlikesRemaining > 0;
      },

      canBoost: () => {
        const { boostsRemaining } = get();
        return boostsRemaining > 0;
      },

      hasFeature: (feature: keyof SubscriptionFeatures) => {
        const { features } = get();
        return features[feature] || false;
      },

      // Helpers
      getPlanById: (planId: string) => {
        const { plans } = get();
        return plans.find((p) => p.id === planId);
      },

      getCurrentPlan: () => {
        const { plans, currentPlanId } = get();
        return plans.find((p) => p.id === currentPlanId);
      },

      reset: () => {
        set({
          plans: [],
          currentPlanId: "free",
          isSubscribed: false,
          features: DEFAULT_FEATURES,
          limits: DEFAULT_LIMITS,
          swipesRemaining: DEFAULT_LIMITS.swipes_per_day,
          aiRepliesRemaining: DEFAULT_LIMITS.ai_replies_per_day,
          superlikesRemaining: DEFAULT_LIMITS.superlikes_per_day,
          boostsRemaining: DEFAULT_LIMITS.boosts_per_month,
          isLoading: false,
          isLoadingPlans: false,
          error: null,
        });
      },
    }),
    {
      name: "spark-subscription-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentPlanId: state.currentPlanId,
        isSubscribed: state.isSubscribed,
        features: state.features,
        limits: state.limits,
        swipesRemaining: state.swipesRemaining,
        aiRepliesRemaining: state.aiRepliesRemaining,
        superlikesRemaining: state.superlikesRemaining,
        boostsRemaining: state.boostsRemaining,
      }),
    }
  )
);

// Hook for checking if user should see paywall
export const useShouldShowPaywall = (feature: keyof SubscriptionFeatures) => {
  const { hasFeature, isSubscribed } = useSubscriptionStore();
  return !isSubscribed && !hasFeature(feature);
};

// Hook for getting remaining usage with formatted string
export const useRemainingUsage = () => {
  const {
    swipesRemaining,
    aiRepliesRemaining,
    superlikesRemaining,
    boostsRemaining,
    features,
    limits,
  } = useSubscriptionStore();

  return {
    swipes: features.unlimited_likes ? "Unlimited" : `${swipesRemaining}`,
    aiReplies: limits.ai_replies_per_day === -1 ? "Unlimited" : `${aiRepliesRemaining}`,
    superlikes: `${superlikesRemaining}`,
    boosts: `${boostsRemaining}`,
  };
};
