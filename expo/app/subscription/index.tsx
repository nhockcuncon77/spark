// Subscription/Paywall Screen
// Displays subscription plans with feature comparison and checkout flow

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Crown,
  Check,
  X,
  Sparkles,
  Heart,
  Eye,
  Zap,
  Filter,
  MessageCircle,
  Undo2,
  Ghost,
  ChevronLeft,
  Star,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { SubscriptionPlan } from "@/services/subscription-service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Feature icons mapping
const FEATURE_ICONS: Record<string, React.ComponentType<any>> = {
  unlimited_likes: Heart,
  see_who_liked: Eye,
  advanced_filters: Filter,
  priority_matching: Zap,
  read_receipts: MessageCircle,
  profile_boost: Star,
  undo_swipe: Undo2,
  ai_replies: Sparkles,
  incognito_mode: Ghost,
  no_ads: X,
};

const FEATURE_LABELS: Record<string, string> = {
  unlimited_likes: "Unlimited Likes",
  see_who_liked: "See Who Liked You",
  advanced_filters: "Advanced Filters",
  priority_matching: "Priority Matching",
  read_receipts: "Read Receipts",
  profile_boost: "Profile Boosts",
  undo_swipe: "Undo Swipes",
  ai_replies: "AI Reply Suggestions",
  incognito_mode: "Incognito Mode",
  no_ads: "Ad-Free Experience",
};

type BillingPeriod = "monthly" | "yearly";

export default function SubscriptionScreen() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const {
    plans,
    currentPlanId,
    isSubscribed,
    fetchPlans,
    checkout,
    isLoadingPlans,
    error,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchPlans();
  }, []);

  // Filter to paid plans only
  const paidPlans = plans.filter((p) => p.id !== "free" && p.is_active);

  const selectedPlan = paidPlans.find((p) => p.id === selectedPlanId);

  const handleCheckout = useCallback(async () => {
    if (!selectedPlan) return;

    setIsCheckingOut(true);
    try {
      const checkoutUrl = await checkout(selectedPlan.id, billingPeriod);

      // For RevenueCat, the URL will be handled by the native SDK
      // For web, open the checkout URL
      if (Platform.OS === "web" || checkoutUrl.startsWith("http")) {
        await Linking.openURL(checkoutUrl);
      }
      // Native platforms will use RevenueCat SDK directly
    } catch (err) {
      console.error("[Subscription] Checkout error:", err);
    } finally {
      setIsCheckingOut(false);
    }
  }, [selectedPlan, billingPeriod, checkout]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getYearlySavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.price_monthly * 12;
    const savings = monthlyTotal - plan.price_yearly;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return percentage;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <LinearGradient
        colors={["#1a0a2e", "#0B0223", "#0B0223"]}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <View style={styles.crownContainer}>
              <Crown size={48} color="#FFD166" />
            </View>
            <Text style={styles.title}>Unlock Premium</Text>
            <Text style={styles.subtitle}>
              Get more matches, more features, and more connections
            </Text>
          </Animated.View>

          {/* Billing Toggle */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.billingToggle}
          >
            <Pressable
              onPress={() => setBillingPeriod("monthly")}
              style={[
                styles.billingOption,
                billingPeriod === "monthly" && styles.billingOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.billingText,
                  billingPeriod === "monthly" && styles.billingTextActive,
                ]}
              >
                Monthly
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setBillingPeriod("yearly")}
              style={[
                styles.billingOption,
                billingPeriod === "yearly" && styles.billingOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.billingText,
                  billingPeriod === "yearly" && styles.billingTextActive,
                ]}
              >
                Yearly
              </Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save 40%</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Plan Cards */}
          {isLoadingPlans ? (
            <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
          ) : (
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={styles.plansContainer}
            >
              {paidPlans.map((plan, index) => {
                const isSelected = plan.id === selectedPlanId;
                const isCurrent = plan.id === currentPlanId && isSubscribed;
                const price =
                  billingPeriod === "monthly"
                    ? plan.price_monthly
                    : Math.round(plan.price_yearly / 12);
                const savings = getYearlySavings(plan);

                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => !isCurrent && setSelectedPlanId(plan.id)}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                      isCurrent && styles.planCardCurrent,
                    ]}
                  >
                    {plan.id === "pro" && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Most Popular</Text>
                      </View>
                    )}

                    <View style={styles.planHeader}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentText}>Current</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.planDescription}>{plan.description}</Text>

                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{formatPrice(price)}</Text>
                      <Text style={styles.priceLabel}>/month</Text>
                    </View>

                    {billingPeriod === "yearly" && (
                      <Text style={styles.billedYearly}>
                        {formatPrice(plan.price_yearly)} billed yearly (save {savings}%)
                      </Text>
                    )}

                    {/* Feature highlights */}
                    <View style={styles.featureHighlights}>
                      {Object.entries(plan.features)
                        .filter(([_, value]) => value === true)
                        .slice(0, 4)
                        .map(([key]) => {
                          const Icon = FEATURE_ICONS[key] || Check;
                          return (
                            <View key={key} style={styles.featureHighlight}>
                              <Icon size={14} color="#22C55E" />
                              <Text style={styles.featureHighlightText}>
                                {FEATURE_LABELS[key]}
                              </Text>
                            </View>
                          );
                        })}
                    </View>

                    {isSelected && !isCurrent && (
                      <View style={styles.selectedIndicator}>
                        <Check size={16} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {/* Feature Comparison */}
          {selectedPlan && (
            <Animated.View
              entering={FadeInUp.delay(400).springify()}
              style={styles.featureSection}
            >
              <Text style={styles.featureSectionTitle}>
                What you get with {selectedPlan.name}
              </Text>

              <View style={styles.featureList}>
                {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                  const hasFeature = selectedPlan.features[key as keyof typeof selectedPlan.features];
                  const Icon = FEATURE_ICONS[key] || Check;

                  return (
                    <View key={key} style={styles.featureRow}>
                      <Icon
                        size={20}
                        color={hasFeature ? "#22C55E" : "rgba(255,255,255,0.3)"}
                      />
                      <Text
                        style={[
                          styles.featureLabel,
                          !hasFeature && styles.featureLabelDisabled,
                        ]}
                      >
                        {label}
                      </Text>
                      {hasFeature ? (
                        <Check size={16} color="#22C55E" />
                      ) : (
                        <X size={16} color="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Limits */}
              <View style={styles.limitsContainer}>
                <Text style={styles.limitsTitle}>Daily Limits</Text>
                <View style={styles.limitsRow}>
                  <Text style={styles.limitLabel}>Swipes per day</Text>
                  <Text style={styles.limitValue}>
                    {selectedPlan.limits.swipes_per_day === -1
                      ? "Unlimited"
                      : selectedPlan.limits.swipes_per_day}
                  </Text>
                </View>
                <View style={styles.limitsRow}>
                  <Text style={styles.limitLabel}>AI replies per day</Text>
                  <Text style={styles.limitValue}>
                    {selectedPlan.limits.ai_replies_per_day === -1
                      ? "Unlimited"
                      : selectedPlan.limits.ai_replies_per_day}
                  </Text>
                </View>
                <View style={styles.limitsRow}>
                  <Text style={styles.limitLabel}>Superlikes per day</Text>
                  <Text style={styles.limitValue}>
                    {selectedPlan.limits.superlikes_per_day}
                  </Text>
                </View>
                <View style={styles.limitsRow}>
                  <Text style={styles.limitLabel}>Boosts per month</Text>
                  <Text style={styles.limitValue}>
                    {selectedPlan.limits.boosts_per_month}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Spacer for checkout button */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Checkout Button */}
        {selectedPlan && currentPlanId !== selectedPlanId && (
          <Animated.View
            entering={FadeInUp.delay(500).springify()}
            style={styles.checkoutContainer}
          >
            <LinearGradient
              colors={["transparent", "#0B0223"]}
              style={styles.checkoutGradient}
            >
              <Pressable
                onPress={handleCheckout}
                disabled={isCheckingOut}
                style={({ pressed }) => [
                  styles.checkoutButton,
                  pressed && styles.checkoutButtonPressed,
                ]}
              >
                {isCheckingOut ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Crown size={20} color="#fff" />
                    <Text style={styles.checkoutText}>
                      Get {selectedPlan.name} -{" "}
                      {formatPrice(
                        billingPeriod === "monthly"
                          ? selectedPlan.price_monthly
                          : selectedPlan.price_yearly
                      )}
                      {billingPeriod === "yearly" ? "/year" : "/month"}
                    </Text>
                  </>
                )}
              </Pressable>
              <Text style={styles.legalText}>
                Cancel anytime. Terms apply.
              </Text>
            </LinearGradient>
          </Animated.View>
        )}
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 209, 102, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  billingToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  billingOptionActive: {
    backgroundColor: "#7C3AED",
  },
  billingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  billingTextActive: {
    color: "#fff",
  },
  saveBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  saveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  loader: {
    marginTop: 40,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: "#7C3AED",
    backgroundColor: "rgba(124, 58, 237, 0.1)",
  },
  planCardCurrent: {
    borderColor: "#22C55E",
    opacity: 0.7,
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  currentBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  planDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  priceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginLeft: 4,
  },
  billedYearly: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 16,
  },
  featureHighlights: {
    gap: 8,
  },
  featureHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureHighlightText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  selectedIndicator: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  featureSection: {
    marginBottom: 24,
  },
  featureSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  featureList: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureLabel: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
  },
  featureLabelDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
  limitsContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  limitsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
  },
  limitsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  limitLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  limitValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  checkoutContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  checkoutGradient: {
    paddingTop: 40,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 16,
  },
  checkoutButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  legalText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 12,
  },
});
