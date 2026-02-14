import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "../../store/useStore";
import { graphqlAuthService, GraphQLUser } from "../../services/graphql-auth";
import { authService } from "../../services/auth";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Settings, LogOut, X, Crown, Sparkles } from "lucide-react-native";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";

// New Components
import {
  ProfileHeader,
  VerificationStatus,
} from "../../components/profile/ProfileHeader";
import { CompletionMeter } from "../../components/profile/CompletionMeter";
import { BioSection } from "../../components/profile/BioSection";
import { PhotoGrid } from "../../components/profile/PhotoGrid";
import { MetadataDisplay } from "../../components/profile/MetadataDisplay";
import { PromptsDisplay } from "../../components/profile/PromptsDisplay";
import { VerificationFlow } from "../../components/profile/VerificationFlow";

import Constants from "expo-constants";

const version = Constants.expoConfig?.version ?? "(latest)";

const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

const convertToUserProfile = (gqlUser: GraphQLUser) => {
  const personalityTraits: Record<string, number> = {};
  gqlUser.personality_traits?.forEach((trait) => {
    personalityTraits[trait.key] = trait.value;
  });

  return {
    id: gqlUser.id,
    email: gqlUser.email,
    firstName: gqlUser.first_name,
    lastName: gqlUser.last_name,
    age: gqlUser.dob ? calculateAge(gqlUser.dob) : undefined,
    bio: gqlUser.bio || "",
    hobbies: gqlUser.hobbies || [],
    personalityTraits,
    photos: gqlUser.photos || [],
    isVerified: gqlUser.is_verified,
    isPhotosRevealed: false,
    extra: gqlUser.extra,
    interests: gqlUser.interests || ([] as string[]),
    user_prompts: gqlUser.user_prompts || ([] as string[]),
  };
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("none");

  // Subscription state
  const { isSubscribed, currentPlanId, getCurrentPlan, fetchSubscriptionStatus } = useSubscriptionStore();
  const currentPlan = getCurrentPlan();

  const fetchProfile = async () => {
    try {
      const result = await graphqlAuthService.getMe();
      if (result.success && result.user) {
        setUser(convertToUserProfile(result.user));

        // Also fetch verification status if user is not verified
        if (!result.user.is_verified) {
          const verificationResult =
            await graphqlAuthService.getVerificationStatus();
          if (verificationResult.success && verificationResult.status) {
            // Map backend status to UI status
            const statusMap: Record<string, VerificationStatus> = {
              PENDING: "pending",
              APPROVED: "approved",
              REJECTED: "rejected",
            };
            setVerificationStatus(
              statusMap[verificationResult.status] || "none",
            );
          }
        } else {
          setVerificationStatus("approved");
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    await fetchSubscriptionStatus();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!user) {
      fetchProfile();
    }
  }, []);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authService.signOut();
            logout();
            router.replace("/(auth)/welcome");
          } catch (error) {
            console.error("Logout failed", error);
            logout();
            router.replace("/(auth)/welcome");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const calculateCompletion = () => {
    let score = 0;
    if (user?.firstName) score += 10;
    if (user?.bio && user.bio.length > 20) score += 20;
    if (user?.photos && user.photos.length >= 3) score += 25;
    else if (user?.photos && user.photos.length > 0) score += 10;
    if (user?.hobbies && user.hobbies.length >= 3) score += 15;
    if (user?.isVerified) score += 15;
    if (user?.extra?.work || user?.extra?.school) score += 10;
    if (user?.user_prompts && user.user_prompts.length > 0) score += 5;
    return Math.min(100, score);
  };

  const displayUser = user || {
    firstName: "User",
    photos: [],
    isVerified: false,
    bio: "",
    personalityTraits: {},
    extra: {},
    hobbies: [],
    interests: [],
    user_prompts: [],
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header Bar */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-transparent z-10">
          <Typography variant="h1" className="text-white">
            Profile
          </Typography>
          <Pressable
            onPress={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
          >
            <Settings size={22} color="#E6E6F0" />
          </Pressable>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#6A1BFF"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <ProfileHeader
            user={displayUser}
            verificationStatus={verificationStatus}
            isOwnProfile
            onEditProfile={() => router.push("/(modals)/edit-profile")}
            onEditPhoto={() => router.push("/(modals)/edit-profile")}
            onStartVerification={() => setShowVerification(true)}
          />

          <CompletionMeter percent={calculateCompletion()} />

          {!displayUser.isVerified && (
            <View className="px-6 mb-6">
              <Pressable
                onPress={() => setShowVerification(true)}
                className="bg-[#6A1BFF]/20 border border-[#6A1BFF]/40 p-4 rounded-xl flex-row items-center justify-between"
              >
                <View>
                  <Typography
                    variant="h3"
                    className="text-white text-base mb-1"
                  >
                    Get Verified
                  </Typography>
                  <Typography variant="caption" className="text-white/60">
                    Unlock full features & trust badge
                  </Typography>
                </View>
                <View className="bg-[#6A1BFF] px-3 py-1.5 rounded-full">
                  <Typography
                    variant="caption"
                    className="text-white font-bold"
                  >
                    Start
                  </Typography>
                </View>
              </Pressable>
            </View>
          )}

          {/* Subscription Section */}
          <View className="px-6 mb-6">
            <Pressable
              onPress={() => router.push("/subscription")}
              className={`p-4 rounded-xl flex-row items-center justify-between ${
                isSubscribed
                  ? "bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40"
                  : "bg-purple-500/20 border border-purple-500/40"
              }`}
              style={{
                backgroundColor: isSubscribed ? "rgba(255, 209, 102, 0.15)" : "rgba(124, 58, 237, 0.15)",
                borderColor: isSubscribed ? "rgba(255, 209, 102, 0.4)" : "rgba(124, 58, 237, 0.4)",
                borderWidth: 1,
              }}
            >
              <View className="flex-row items-center gap-3">
                {isSubscribed ? (
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(255, 209, 102, 0.2)" }}
                  >
                    <Crown size={20} color="#FFD166" />
                  </View>
                ) : (
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(124, 58, 237, 0.2)" }}
                  >
                    <Sparkles size={20} color="#7C3AED" />
                  </View>
                )}
                <View>
                  <Typography
                    variant="h3"
                    className="text-white text-base mb-0.5"
                  >
                    {isSubscribed ? currentPlan?.name || "Premium" : "Upgrade to Premium"}
                  </Typography>
                  <Typography variant="caption" className="text-white/60">
                    {isSubscribed
                      ? "Manage your subscription"
                      : "Unlimited likes, AI replies & more"}
                  </Typography>
                </View>
              </View>
              <View
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: isSubscribed ? "#FFD166" : "#7C3AED",
                }}
              >
                <Typography
                  variant="caption"
                  className="font-bold"
                  style={{ color: isSubscribed ? "#000" : "#fff" }}
                >
                  {isSubscribed ? "Manage" : "Upgrade"}
                </Typography>
              </View>
            </Pressable>
          </View>

          <BioSection
            bio={displayUser.bio}
            isOwnProfile
            onAIGenerate={() => router.push("/(modals)/edit-profile")} // Redirect to edit for AI generation
          />

          <View className="mt-2">
            <PhotoGrid photos={displayUser.photos} />
          </View>

          <PromptsDisplay prompts={displayUser.user_prompts || []} />

          <MetadataDisplay
            extra={displayUser.extra}
            hobbies={displayUser.hobbies}
            interests={displayUser.interests || []}
          />

          <View className="px-6 mt-6 mb-10">
            <Typography
              variant="caption"
              className="text-center text-white/30 mb-2"
            >
              Version {version} • Spark
            </Typography>
            <Typography
              variant="caption"
              className="text-center text-pink-500 mb-6 underline"
              onPress={() =>
                Linking.openURL("https://github.com/yourapp/spark")
              }
            >
              Made with ❤️ by MelloB
            </Typography>
            <Button
              variant="secondary"
              className="w-full border border-red-500/30 bg-red-500/10"
              onPress={handleLogout}
              loading={isLoggingOut}
              icon={<LogOut size={18} color="#EF4444" />}
            >
              <Typography className="text-[#EF4444]">Log Out</Typography>
            </Button>
          </View>
        </ScrollView>

        <Modal
          visible={showSettings}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <GradientBackground>
            <SafeAreaView className="flex-1">
              <View className="flex-1 p-6">
                <View className="flex-row justify-between items-center mb-8">
                  <Typography variant="h1" className="text-white">
                    Settings
                  </Typography>
                  <Pressable
                    onPress={() => setShowSettings(false)}
                    className="p-2 bg-white/10 rounded-full"
                  >
                    <X size={24} color="white" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Subscription Section in Settings */}
                  <Typography
                    variant="h3"
                    className="text-white/40 text-xs uppercase tracking-wider mb-3"
                  >
                    Subscription
                  </Typography>

                  <Pressable
                    onPress={() => {
                      setShowSettings(false);
                      router.push("/subscription");
                    }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex-row justify-between items-center"
                  >
                    <View className="flex-row items-center gap-3">
                      <Crown size={20} color={isSubscribed ? "#FFD166" : "#7C3AED"} />
                      <View>
                        <Typography className="text-white">
                          {isSubscribed ? currentPlan?.name || "Premium Plan" : "Upgrade to Premium"}
                        </Typography>
                        <Typography className="text-white/40 text-xs">
                          {isSubscribed ? "View & manage subscription" : "Get unlimited features"}
                        </Typography>
                      </View>
                    </View>
                    <Typography className="text-white/40">→</Typography>
                  </Pressable>

                  {/* Account Section */}
                  <Typography
                    variant="h3"
                    className="text-white/40 text-xs uppercase tracking-wider mb-3"
                  >
                    Account
                  </Typography>

                  <Pressable
                    onPress={() =>
                      Linking.openURL(
                        "https://spark-frontend-tlcj.onrender.com/docs/privacy",
                      )
                    }
                    className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2 flex-row justify-between items-center"
                  >
                    <Typography className="text-white">
                      Privacy Policy
                    </Typography>
                    <Typography className="text-white/40">→</Typography>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      Linking.openURL(
                        "https://spark.example.com/docs/legal/terms",
                      )
                    }
                    className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2 flex-row justify-between items-center"
                  >
                    <Typography className="text-white">
                      Terms of Service
                    </Typography>
                    <Typography className="text-white/40">→</Typography>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      Linking.openURL("mailto:support@spark.example.com")
                    }
                    className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex-row justify-between items-center"
                  >
                    <Typography className="text-white">
                      Contact Support
                    </Typography>
                    <Typography className="text-white/40">→</Typography>
                  </Pressable>

                  {/* Danger Zone */}
                  <Typography
                    variant="h3"
                    className="text-red-400/60 text-xs uppercase tracking-wider mb-3"
                  >
                    Danger Zone
                  </Typography>

                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        "Delete Account",
                        "This will permanently delete your account and all associated data. This action cannot be undone.\n\nYou will receive a confirmation code via email to complete the deletion.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Continue",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                // Request account deletion - will send confirmation code
                                const result =
                                  await graphqlAuthService.requestAccountDeletion();
                                if (result.success) {
                                  Alert.alert(
                                    "Check Your Email",
                                    "We've sent a confirmation code to your email. Enter it on the deletion page to complete the process.",
                                    [
                                      {
                                        text: "Open Deletion Page",
                                        onPress: () =>
                                          Linking.openURL(
                                            "https://spark-frontend-tlcj.onrender.com/delete-account",
                                          ),
                                      },
                                    ],
                                  );
                                } else {
                                  Alert.alert(
                                    "Error",
                                    result.error ||
                                      "Failed to request account deletion",
                                  );
                                }
                              } catch (error) {
                                Alert.alert(
                                  "Error",
                                  "Something went wrong. Please try again.",
                                );
                              }
                            },
                          },
                        ],
                      );
                    }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex-row justify-between items-center"
                  >
                    <View>
                      <Typography className="text-red-400 font-semibold">
                        Delete Account
                      </Typography>
                      <Typography className="text-red-400/60 text-xs mt-1">
                        Permanently remove all data
                      </Typography>
                    </View>
                    <Typography className="text-red-400/40">→</Typography>
                  </Pressable>
                </ScrollView>
              </View>
            </SafeAreaView>
          </GradientBackground>
        </Modal>

        {/* Verification Modal */}
        <Modal
          visible={showVerification}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <VerificationFlow
            onCancel={() => setShowVerification(false)}
            onComplete={() => {
              setShowVerification(false);
              Alert.alert("Success", "Verification submitted successfully!");
              fetchProfile();
            }}
          />
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}
