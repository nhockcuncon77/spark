import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  StatusBar,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import Animated, { FadeOut, BounceIn } from "react-native-reanimated";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { SwipeCard, SwipeCardProfile } from "../../components/ui/SwipeCard";
import { useSwipeStore } from "../../store/useSwipeStore";
import { useAIStore } from "../../store/useAIStore";
import {
  X,
  Heart,
  Sparkles,
  SlidersHorizontal,
  MapPin,
  Users,
  Calendar,
  Check,
  RefreshCw,
  Share2,
} from "lucide-react-native";
import { GradientBackground } from "../../components/ui/GradientBackground";

// Filter options
const AGE_RANGES = [
  { label: "18-24", min: 18, max: 24 },
  { label: "25-30", min: 25, max: 30 },
  { label: "31-40", min: 31, max: 40 },
  { label: "40+", min: 40, max: 100 },
];

const DISTANCE_OPTIONS = [
  { label: "1 km", value: 1 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50+ km", value: 50 },
];

const GENDER_OPTIONS = [
  { label: "Women", value: "FEMALE" },
  { label: "Men", value: "MALE" },
  { label: "Everyone", value: "" },
];

export default function SwipeScreen() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [lastAction, setLastAction] = useState<{
    profile: SwipeCardProfile;
    action: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "like" | "pass" | "superlike";
    text: string;
  } | null>(null);

  const {
    profiles,
    currentIndex,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    fetchRecommendations,
    refresh,
    swipe,
    loadMore,
    setFilter,
    filter,
  } = useSwipeStore();

  // AI Store for profile summaries
  const { profileSummaries, fetchProfileSummary } = useAIStore();

  // Filter states - initialize from store filter if exists
  const [selectedGender, setSelectedGender] = useState<string | null>(
    filter?.gender ?? null,
  );
  const [selectedAgeRange, setSelectedAgeRange] = useState<number | null>(
    () => {
      if (filter?.min_age && filter?.max_age) {
        return AGE_RANGES.findIndex(
          (r) => r.min === filter.min_age && r.max === filter.max_age,
        );
      }
      return null;
    },
  );
  const [selectedDistance, setSelectedDistance] = useState<number>(
    filter?.max_distance_km ?? 25,
  );
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(
    filter?.verified_only ?? false,
  );

  // Initial load
  useEffect(() => {
    if (profiles.length === 0) {
      fetchRecommendations();
    }
  }, [profiles.length, fetchRecommendations]);

  // Load more when running low on profiles
  useEffect(() => {
    loadMore();
  }, [currentIndex, profiles.length, loadMore]);

  // Fetch AI summary only for the current (top) profile
  useEffect(() => {
    const currentProfile = profiles[currentIndex];
    if (currentProfile && !profileSummaries[currentProfile.id]) {
      fetchProfileSummary(currentProfile.id);
    }
  }, [currentIndex, profiles, profileSummaries, fetchProfileSummary]);

  const handleSwipeLeft = useCallback(
    async (profile: SwipeCardProfile) => {
      setLastAction({ profile, action: "Passed" });
      setFeedback({ type: "pass", text: "NOPE" });
      setTimeout(() => setFeedback(null), 800);

      // Submit to API via store
      const result = await swipe(profile.id, "DISLIKE");
      if (!result.success) {
        console.error("Failed to submit swipe:", result.error);
      }
    },
    [swipe],
  );

  const handleSwipeRight = useCallback(
    async (profile: SwipeCardProfile) => {
      setLastAction({ profile, action: "Liked" });
      setFeedback({ type: "like", text: "LIKE" });
      setTimeout(() => setFeedback(null), 800);

      // Submit to API via store
      const result = await swipe(profile.id, "LIKE");
      if (result.success && result.isMatch) {
        Alert.alert(
          "It's a Match! 🎉",
          `You and ${profile.firstName} liked each other! Start chatting to unlock photos.`,
          [
            {
              text: "Start Chatting",
              onPress: () => router.push("/(tabs)/chat" as Href),
            },
            { text: "Keep Swiping" },
          ],
        );
      } else if (!result.success) {
        console.error("Failed to submit swipe:", result.error);
      }
    },
    [swipe, router],
  );

  const handleSwipeUp = useCallback(
    async (profile: SwipeCardProfile) => {
      setLastAction({ profile, action: "Super Liked" });
      setFeedback({ type: "superlike", text: "SUPER LIKE" });
      setTimeout(() => setFeedback(null), 800);

      // Submit to API via store
      const result = await swipe(profile.id, "SUPERLIKE");
      if (result.success && result.isMatch) {
        Alert.alert(
          "Super Like Match! ⭐",
          `${profile.firstName} also likes you! You're now matched.`,
          [
            {
              text: "Start Chatting",
              onPress: () => router.push("/(tabs)/chat" as Href),
            },
            { text: "Keep Swiping" },
          ],
        );
      } else if (result.success) {
        Alert.alert(
          "Super Like Sent! ⭐",
          `${profile.firstName} will be notified that you super liked them!`,
        );
      } else {
        console.error("Failed to submit swipe:", result.error);
      }
    },
    [swipe, router],
  );

  const handleShare = useCallback((profile: SwipeCardProfile) => {
    Alert.alert(
      "Share Profile",
      `Share ${profile.firstName}'s profile with a friend?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Share",
          onPress: () => {
            Alert.alert(
              "Shared!",
              `You've shared ${profile.firstName}'s profile link.`,
            );
          },
        },
      ],
    );
  }, []);

  const handleAppInvite = async () => {
    try {
      const shareContent =
        Platform.OS === "android"
          ? {
            message:
              "Spark is a personality-first dating app. Meet people through hobbies and conversation before photos. Join here: https://spark.example.com",
          }
          : {
            title: "Spark — Meet the person first. Looks later.",
            message:
              "Spark is a personality-first dating app. Meet people through hobbies and conversation before photos.",
            url: "https://spark-frontend-tlcj.onrender.com",
          };

      const result = await Share.share(shareContent, {
        dialogTitle: "Invite friends to Spark",
      });

      if (result.action === Share.sharedAction) {
        // Tracking
      }
    } catch (error) {
      console.error("Error sharing Spark link:", error);
    }
  };

  const handleReport = useCallback((profile: SwipeCardProfile) => {
    const confirmReport = () => {
      Alert.alert(
        "Report Received",
        "Thank you for keeping our community safe. We will review this profile shortly.",
        [{ text: "OK" }],
      );
    };

    Alert.alert(
      "Report Profile",
      `Why are you reporting ${profile.firstName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Inappropriate Content",
          onPress: confirmReport,
        },
        {
          text: "Fake Profile",
          onPress: confirmReport,
        },
        {
          text: "Harassment",
          onPress: confirmReport,
        },
      ],
    );
  }, []);

  const handleAskAi = useCallback(
    (profile: SwipeCardProfile) => {
      router.push(
        `/(tabs)/maytri?profileName=${profile.firstName}&profileId=${profile.id}` as Href,
      );
    },
    [router],
  );

  const handleButtonSwipe = (direction: "left" | "right" | "up") => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    if (direction === "left") {
      handleSwipeLeft(currentProfile);
    } else if (direction === "right") {
      handleSwipeRight(currentProfile);
    } else {
      handleSwipeUp(currentProfile);
    }
  };

  const handleRefresh = () => {
    refresh();
  };

  const applyFilters = () => {
    // Build filter object
    const newFilter: {
      gender?: string;
      min_age?: number;
      max_age?: number;
      max_distance_km?: number;
      verified_only?: boolean;
    } = {};

    // Gender filter (empty string means "Everyone" - use server default)
    if (selectedGender && selectedGender !== "") {
      newFilter.gender = selectedGender;
    }

    // Age range filter
    if (selectedAgeRange !== null) {
      newFilter.min_age = AGE_RANGES[selectedAgeRange].min;
      newFilter.max_age = AGE_RANGES[selectedAgeRange].max;
    }

    // Distance filter (optional, requires location)
    // newFilter.max_distance_km = selectedDistance;

    // Verified only filter
    if (showVerifiedOnly) {
      newFilter.verified_only = true;
    }

    // Set filter in store and refresh
    setFilter(Object.keys(newFilter).length > 0 ? newFilter : null);
    setShowFilters(false);
    handleRefresh();
  };

  const resetFilters = () => {
    setSelectedGender(null);
    setSelectedAgeRange(null);
    setSelectedDistance(25);
    setShowVerifiedOnly(false);
  };

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);
  const hasProfiles = visibleProfiles.length > 0;

  // Loading state
  if (isLoading && profiles.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#7C3AED" />
        <Typography variant="body" color="muted" className="mt-4">
          Finding people for you...
        </Typography>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && profiles.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <StatusBar barStyle="light-content" />
        <View className="w-20 h-20 rounded-full bg-surface-elevated items-center justify-center mb-4">
          <X size={40} color="#EF4444" />
        </View>
        <Typography variant="h2" className="text-center mb-2">
          Something went wrong
        </Typography>
        <Typography variant="body" color="muted" className="text-center mb-6">
          {error}
        </Typography>
        <Button variant="primary" onPress={handleRefresh}>
          <View className="flex-row items-center gap-2">
            <RefreshCw size={18} color="#FFFFFF" />
            <Typography className="text-white">Try Again</Typography>
          </View>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top"]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View className="px-4 py-3 flex-row justify-between items-center">
          <View className="w-10" />
          <View className="flex-row items-center gap-2">
            <Image
              source={require("../../assets/main-trans.png")}
              style={{ width: 80, height: 40, tintColor: "#fff" }}
              resizeMode="contain"
            />
          </View>
          <Pressable
            onPress={() => setShowFilters(true)}
            className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center border border-white/10 active:bg-surface"
          >
            <SlidersHorizontal size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Card Stack - Adjusted positioning */}
        <View
          className="flex-1 items-center justify-center px-4"
          style={{
            marginTop: 8,
            marginBottom: 100,
            transform: [{ scale: 0.9 }],
          }}
        >
          {/* Feedback Animation Overlay */}
          {feedback && (
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ zIndex: 100 }}
              pointerEvents="none"
            >
              <Animated.View
                entering={BounceIn.duration(400)}
                exiting={FadeOut.duration(200)}
                className={`px-10 py-6 border-4 rounded-3xl transform -rotate-12 ${feedback.type === "like"
                  ? "border-[#14D679] bg-[#14D679]/20"
                  : feedback.type === "pass"
                    ? "border-[#FF4C61] bg-[#FF4C61]/20"
                    : "border-[#6A1BFF] bg-[#6A1BFF]/20"
                  }`}
              >
                <Typography
                  variant="h1"
                  className={`text-5xl font-black uppercase tracking-widest ${feedback.type === "like"
                    ? "text-[#14D679]"
                    : feedback.type === "pass"
                      ? "text-[#FF4C61]"
                      : "text-[#6A1BFF]"
                    }`}
                >
                  {feedback.text}
                </Typography>
              </Animated.View>
            </View>
          )}

          {hasProfiles ? (
            <>
              {visibleProfiles
                .map((profile, index) => (
                  <SwipeCard
                    key={profile.id}
                    profile={{
                      ...profile,
                      aiSummary:
                        profileSummaries[profile.id] || profile.aiSummary,
                    }}
                    index={index}
                    isFirst={index === 0}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                    onSwipeUp={handleSwipeUp}
                    onShare={handleShare}
                    onReport={handleReport}
                    onAskAi={handleAskAi}
                  />
                ))
                .reverse()}

              {/* Loading more */}
              {isLoadingMore && (
                <View className="absolute bottom-4">
                  <ActivityIndicator size="small" color="#6A1BFF" />
                </View>
              )}
            </>
          ) : (
            <View className="items-center justify-center px-8">
              <View className="w-24 h-24 rounded-full bg-surface-elevated items-center justify-center mb-6 border border-white/10">
                <Heart size={48} color="#6A1BFF" />
              </View>
              <Typography variant="h2" className="text-center mb-2 text-white">
                {hasMore ? "Loading more..." : "No more profiles"}
              </Typography>
              <Typography
                variant="body"
                color="muted"
                className="text-center mb-6"
              >
                {hasMore
                  ? "Finding more people for you..."
                  : "You've seen everyone nearby. Check back later or help Spark grow by sharing the app with your friends!"}
              </Typography>
              <Button variant="primary" onPress={handleRefresh}>
                <View className="flex-row items-center gap-2">
                  <RefreshCw size={18} color="#FFFFFF" />
                  <Typography className="text-white">Refresh</Typography>
                </View>
              </Button>
              <Button
                className="my-4"
                variant="secondary"
                onPress={handleAppInvite}
              >
                <View className="flex-row items-center gap-2">
                  <Share2 size={18} color="#FFFFFF" />
                  <Typography className="text-white">
                    Invite More People to Spark!
                  </Typography>
                </View>
              </Button>
            </View>
          )}
        </View>

        {/* Action Buttons - Fixed positioning at bottom */}
        {hasProfiles && (
          <View
            className="absolute bottom-0 left-0 right-0 flex-row justify-center items-center gap-8 pb-8 pt-4 bg-gradient-to-t from-black/50"
            style={{
              zIndex: 50,
            }}
          >
            <Pressable
              onPress={() => handleButtonSwipe("left")}
              className="w-16 h-16 rounded-full bg-[#1D0F45] items-center justify-center border-2 border-[#FF4C61] active:scale-95 shadow-lg shadow-[#FF4C61]/30"
              style={{
                // shadowColor: "#FF4C61",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <X size={32} color="#FF4C61" strokeWidth={3} />
            </Pressable>

            <Pressable
              onPress={() => handleButtonSwipe("up")}
              className="w-14 h-14 rounded-full bg-[#1D0F45] items-center justify-center border-2 border-[#6A1BFF] active:scale-90 shadow-lg shadow-[#6A1BFF]/30"
              style={{
                // shadowColor: "#6A1BFF",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <Sparkles size={24} color="#6A1BFF" fill="#6A1BFF" />
            </Pressable>

            <Pressable
              onPress={() => handleButtonSwipe("right")}
              className="w-16 h-16 rounded-full bg-[#1D0F45] items-center justify-center border-2 border-[#14D679] active:scale-95 shadow-lg shadow-[#14D679]/30"
              style={{
                // shadowColor: "#14D679",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <Heart size={32} color="#14D679" fill="#14D679" />
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={true}
      >
        <SafeAreaView className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-surface-elevated">
            <Pressable onPress={() => setShowFilters(false)}>
              <X size={24} color="#E6E6F0" />
            </Pressable>
            <Typography variant="h2">Filters</Typography>
            <Pressable onPress={resetFilters}>
              <Typography variant="label" color="primary">
                Reset
              </Typography>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 py-6">
            {/* Age Range */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <Calendar size={20} color="#7C3AED" />
                <Typography variant="h3" className="ml-2">
                  Age Range
                </Typography>
              </View>
              <View className="flex-row flex-wrap gap-3">
                {AGE_RANGES.map((range, index) => (
                  <Chip
                    key={range.label}
                    label={range.label}
                    variant={selectedAgeRange === index ? "primary" : "outline"}
                    selected={selectedAgeRange === index}
                    onPress={() =>
                      setSelectedAgeRange(
                        selectedAgeRange === index ? null : index,
                      )
                    }
                  />
                ))}
              </View>
            </View>

            {/* Gender Preference */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <Users size={20} color="#7C3AED" />
                <Typography variant="h3" className="ml-2">
                  Show Me
                </Typography>
              </View>
              <View className="flex-row flex-wrap gap-3">
                {GENDER_OPTIONS.map((option) => (
                  <Chip
                    key={option.value || "everyone"}
                    label={option.label}
                    variant={
                      selectedGender === option.value ? "primary" : "outline"
                    }
                    selected={selectedGender === option.value}
                    onPress={() => setSelectedGender(option.value)}
                  />
                ))}
              </View>
              <Typography variant="caption" color="muted" className="mt-2">
                Default: Opposite gender based on your profile
              </Typography>
            </View>

            {/* Distance */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <MapPin size={20} color="#7C3AED" />
                <Typography variant="h3" className="ml-2">
                  Maximum Distance
                </Typography>
              </View>
              <View className="flex-row flex-wrap gap-3">
                {DISTANCE_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    variant={
                      selectedDistance === option.value ? "primary" : "outline"
                    }
                    selected={selectedDistance === option.value}
                    onPress={() => setSelectedDistance(option.value)}
                  />
                ))}
              </View>
            </View>

            {/* Verified Only */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <Users size={20} color="#7C3AED" />
                <Typography variant="h3" className="ml-2">
                  Profile Type
                </Typography>
              </View>
              <Card variant="elevated" padding="md">
                <Pressable
                  onPress={() => setShowVerifiedOnly(!showVerifiedOnly)}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Typography variant="body">
                      Verified Profiles Only
                    </Typography>
                    <Typography variant="caption" color="muted">
                      Only show profiles that have been verified
                    </Typography>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-md items-center justify-center ${showVerifiedOnly
                      ? "bg-primary"
                      : "bg-surface border border-muted/30"
                      }`}
                  >
                    {showVerifiedOnly && <Check size={16} color="#FFFFFF" />}
                  </View>
                </Pressable>
              </Card>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View className="px-4 py-4 border-t border-surface-elevated">
            <Button
              variant="primary"
              size="lg"
              onPress={applyFilters}
              className="w-full"
            >
              Apply Filters
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </GradientBackground>
  );
}
