import React from "react";
import { Dimensions, StyleSheet, View, Image, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Extrapolation,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Typography } from "./Typography";
import { Chip } from "./Chip";
import { Badge } from "./Badge";
import {
  Heart,
  X,
  Sparkles,
  CheckCircle2,
  MapPin,
  Clock,
  Globe,
  Star,
  Flag,
  Share2,
  Lock,
  Quote,
  MessageCircle,
  GraduationCap,
  Briefcase,
  Wine,
  Cigarette,
  Baby,
  Church,
  Users,
  Dumbbell,
} from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VERTICAL_THRESHOLD = SCREEN_HEIGHT * 0.15;
const ROTATION_ANGLE = 12;

export interface SwipeCardProfile {
  id: string;
  firstName: string;
  age: number;
  bio: string;
  hobbies: string[];
  traits: string[];
  photos: string[];
  isRevealed: boolean;
  isVerified: boolean;
  matchScore: number;
  distance: string;
  area?: string;
  languages?: string[];
  zodiac?: string;
  lastActive?: string;
  prompts?: { question: string; answer: string }[];
  aiSummary?: string;
  extra?: {
    school?: string;
    work?: string;
    lookingFor?: string[];
    exercise?: string;
    drinking?: string;
    smoking?: string;
    kids?: string;
    religion?: string;
    ethnicity?: string;
    sexuality?: string;
  };
}

interface SwipeCardProps {
  profile: SwipeCardProfile;
  onSwipeLeft?: (profile: SwipeCardProfile) => void;
  onSwipeRight?: (profile: SwipeCardProfile) => void;
  onSwipeUp?: (profile: SwipeCardProfile) => void;
  onShare?: (profile: SwipeCardProfile) => void;
  onReport?: (profile: SwipeCardProfile) => void;
  onAskAi?: (profile: SwipeCardProfile) => void;
  isFirst?: boolean;
  index?: number;
}

export function SwipeCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onShare,
  onReport,
  onAskAi,
  isFirst = false,
  index = 0,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Track which action will be taken
  const activeAction = useSharedValue<"none" | "like" | "nope" | "super">(
    "none",
  );

  const handleSwipeComplete = (direction: "left" | "right" | "up") => {
    if (direction === "left" && onSwipeLeft) {
      onSwipeLeft(profile);
    } else if (direction === "right" && onSwipeRight) {
      onSwipeRight(profile);
    } else if (direction === "up" && onSwipeUp) {
      onSwipeUp(profile);
    }
  };

  const determineAction = (
    x: number,
    y: number,
  ): "none" | "like" | "nope" | "super" => {
    "worklet";
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    // If vertical movement is dominant and significant, it's a super like
    if (y < -VERTICAL_THRESHOLD && absY > absX * 1.5) {
      return "super";
    }

    // If horizontal movement is dominant
    if (absX > SWIPE_THRESHOLD * 0.5) {
      if (x > 0) {
        return "like";
      } else {
        return "nope";
      }
    }

    return "none";
  };

  const panGesture = Gesture.Pan()
    .enabled(isFirst)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Determine which action indicator to show
      activeAction.value = determineAction(
        event.translationX,
        event.translationY,
      );
    })
    .onEnd((event) => {
      const action = determineAction(event.translationX, event.translationY);

      // Super like (swipe up) - only if it's clearly a vertical gesture
      if (action === "super") {
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)("up");
        });
        translateX.value = withTiming(translateX.value * 0.5, {
          duration: 300,
        });
        activeAction.value = "none";
        return;
      }

      // Swipe right (like)
      if (
        action === "like" &&
        (translateX.value > SWIPE_THRESHOLD || event.velocityX > 800)
      ) {
        translateX.value = withTiming(
          SCREEN_WIDTH * 1.5,
          { duration: 300 },
          () => {
            runOnJS(handleSwipeComplete)("right");
          },
        );
        translateY.value = withTiming(translateY.value + 50, { duration: 300 });
        activeAction.value = "none";
        return;
      }

      // Swipe left (pass)
      if (
        action === "nope" &&
        (translateX.value < -SWIPE_THRESHOLD || event.velocityX < -800)
      ) {
        translateX.value = withTiming(
          -SCREEN_WIDTH * 1.5,
          { duration: 300 },
          () => {
            runOnJS(handleSwipeComplete)("left");
          },
        );
        translateY.value = withTiming(translateY.value + 50, { duration: 300 });
        activeAction.value = "none";
        return;
      }

      // Return to center
      translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      activeAction.value = "none";
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolation.CLAMP,
    );

    // Scale down cards that are behind
    const cardScale = isFirst
      ? scale.value
      : interpolate(index, [0, 1, 2], [1, 0.95, 0.9], Extrapolation.CLAMP);

    // Offset cards behind vertically
    const cardTranslateY = isFirst
      ? translateY.value
      : interpolate(index, [0, 1, 2], [0, -15, -30], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: cardTranslateY },
        { rotate: `${rotation}deg` },
        { scale: cardScale },
      ],
    };
  });

  // Only show LIKE indicator when action is "like"
  const likeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = activeAction.value === "like" ? 1 : 0;
    return {
      opacity: withTiming(opacity, { duration: 150 }),
    };
  });

  // Only show NOPE indicator when action is "nope"
  const nopeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = activeAction.value === "nope" ? 1 : 0;
    return {
      opacity: withTiming(opacity, { duration: 150 }),
    };
  });

  // Only show SUPER indicator when action is "super"
  const superLikeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = activeAction.value === "super" ? 1 : 0;
    return {
      opacity: withTiming(opacity, { duration: 150 }),
    };
  });

  const handleShare = () => {
    if (onShare) {
      onShare(profile);
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport(profile);
    }
  };

  const handleAskAi = () => {
    if (onAskAi) {
      onAskAi(profile);
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.cardContainer,
          cardAnimatedStyle,
          { zIndex: 100 - index },
        ]}
      >
        {/* Swipe Indicators - Only show one at a time */}
        {isFirst && (
          <>
            {/* LIKE Indicator */}
            <Animated.View
              style={[
                styles.indicator,
                styles.likeIndicator,
                likeIndicatorStyle,
              ]}
            >
              <Heart size={32} color="#14D679" fill="#14D679" />
              <Typography variant="h3" className="text-success ml-2">
                LIKE
              </Typography>
            </Animated.View>

            {/* NOPE Indicator */}
            <Animated.View
              style={[
                styles.indicator,
                styles.nopeIndicator,
                nopeIndicatorStyle,
              ]}
            >
              <X size={32} color="#FF4C61" strokeWidth={3} />
              <Typography variant="h3" className="text-danger ml-2">
                NOPE
              </Typography>
            </Animated.View>

            {/* SUPER LIKE Indicator */}
            <Animated.View
              style={[
                styles.indicator,
                styles.superLikeIndicator,
                superLikeIndicatorStyle,
              ]}
            >
              <Sparkles size={32} color="#6A1BFF" fill="#6A1BFF" />
              <Typography variant="h3" className="text-primary ml-2">
                SUPER
              </Typography>
            </Animated.View>
          </>
        )}

        {/* Card Content */}
        <Animated.ScrollView
          className="flex-1 bg-[#1D0F45] rounded-[32px] overflow-hidden border-[3px] border-white/20"
          showsVerticalScrollIndicator={false}
          scrollEnabled={isFirst}
          nestedScrollEnabled
        >
          {/* Photo Section with Blur */}
          <View className="relative h-48 bg-surface">
            {profile.photos && profile.photos.length > 0 ? (
              <>
                <Image
                  source={{ uri: profile.photos[0] }}
                  style={styles.photo}
                  blurRadius={profile.isRevealed ? 0 : 25}
                />
                {!profile.isRevealed && (
                  <BlurView
                    intensity={80}
                    tint="dark"
                    style={styles.blurOverlay}
                  >
                    <View className="flex-1 items-center justify-center">
                      <View className="w-16 h-16 rounded-full bg-surface-elevated/80 items-center justify-center mb-2">
                        <Lock size={28} color="#7C3AED" />
                      </View>
                      <Typography variant="label" className="text-white">
                        Photo Hidden
                      </Typography>
                      <Typography
                        variant="caption"
                        color="muted"
                        className="mt-1"
                      >
                        Match & chat to unlock
                      </Typography>
                    </View>
                  </BlurView>
                )}
              </>
            ) : (
              <View className="flex-1 items-center justify-center bg-surface">
                <Lock size={32} color="#A6A6B2" />
                <Typography variant="caption" color="muted" className="mt-2">
                  No photo available
                </Typography>
              </View>
            )}

            {/* Top Actions */}
            <View className="absolute top-3 right-3 flex-row gap-2">
              <Pressable
                className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
                onPress={handleShare}
              >
                <Share2 size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable
                className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
                onPress={handleReport}
              >
                <Flag size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Match Score Badge */}
            <View className="absolute bottom-3 left-3">
              <Badge
                label={`${profile.matchScore}% Match`}
                variant="ai"
                icon={<Sparkles size={10} color="#FFD166" />}
              />
            </View>
          </View>

          {/* Profile Info Section */}
          <View className="p-4">
            {/* Name, Age, Verified */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2 flex-1">
                <Typography variant="h2" className="text-xl">
                  {profile.firstName}, {profile.age}
                </Typography>
                {profile.isVerified && (
                  <CheckCircle2 size={18} color="#16A34A" fill="#16A34A" />
                )}
              </View>
              {profile.lastActive && (
                <View className="flex-row items-center">
                  <Clock size={12} color="#A6A6B2" />
                  <Typography
                    variant="caption"
                    color="muted"
                    className="ml-1 text-xs"
                  >
                    {profile.lastActive}
                  </Typography>
                </View>
              )}
            </View>

            {/* Location */}
            <View className="flex-row items-center mb-3">
              <MapPin size={14} color="#A6A6B2" />
              <Typography variant="caption" color="muted" className="ml-1">
                {profile.distance}
                {profile.area && ` • ${profile.area}`}
              </Typography>
            </View>

            {/* Quick Info Row */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {profile.zodiac && (
                <View className="flex-row items-center bg-surface rounded-full px-2.5 py-1">
                  <Star size={12} color="#FFD166" />
                  <Typography
                    variant="caption"
                    color="muted"
                    className="ml-1.5"
                  >
                    {profile.zodiac}
                  </Typography>
                </View>
              )}
              {profile.languages && profile.languages.length > 0 && (
                <View className="flex-row items-center bg-surface rounded-full px-2.5 py-1">
                  <Globe size={12} color="#7C3AED" />
                  <Typography
                    variant="caption"
                    color="muted"
                    className="ml-1.5"
                  >
                    {profile.languages.slice(0, 2).join(", ")}
                    {profile.languages.length > 2 &&
                      ` +${profile.languages.length - 2}`}
                  </Typography>
                </View>
              )}
            </View>

            {/* AI Summary */}
            <View className="mb-6 bg-surface-elevated rounded-2xl p-4 border border-ai/20">
              <View className="flex-row items-center mb-2">
                <Sparkles size={14} color="#FFD166" />
                <Typography variant="label" color="ai" className="ml-2">
                  AI Summary
                </Typography>
              </View>
              <Typography
                variant="body"
                className="text-sm leading-relaxed text-muted"
              >
                {profile.aiSummary ||
                  `${profile.firstName} appears to be a ${profile.traits[0]?.toLowerCase() || "unique"
                  } soul who loves ${profile.hobbies[0]?.toLowerCase() || "exploring"
                  }. A perfect match if you're looking for someone ${profile.traits[1]?.toLowerCase() || "genuine"
                  }!`}
              </Typography>
            </View>

            {/* Ask Maytri Button */}
            <Pressable
              onPress={handleAskAi}
              className="flex-row items-center justify-center bg-ai/10 py-3 rounded-xl border border-ai/30 mb-6 active:bg-ai/20"
            >
              <MessageCircle size={18} color="#FFD166" />
              <Typography
                variant="label"
                color="ai"
                className="ml-2 font-semibold"
              >
                Ask Maytri about {profile.firstName}
              </Typography>
            </Pressable>

            {/* Bio */}
            <View className="mb-6">
              <Typography variant="h3" className="mb-2 text-base">
                About Me
              </Typography>
              <Typography
                variant="body"
                className="leading-relaxed"
                numberOfLines={4}
              >
                {profile.bio}
              </Typography>
            </View>

            {/* Prompts - Enhanced UI */}
            {profile.prompts && profile.prompts.length > 0 && (
              <View className="mb-6">
                {profile.prompts.slice(0, 2).map((prompt, idx) => (
                  <View
                    key={idx}
                    className="mb-3 bg-surface rounded-2xl p-4 border border-white/5"
                  >
                    <View className="flex-row items-start">
                      <Quote
                        size={16}
                        color="#7C3AED"
                        style={{ marginTop: 2, marginRight: 8 }}
                      />
                      <View className="flex-1">
                        <Typography
                          variant="caption"
                          color="primary"
                          className="mb-1 font-medium uppercase tracking-wide text-[10px]"
                        >
                          {prompt.question}
                        </Typography>
                        <Typography
                          variant="body"
                          className="text-base italic text-white/90 leading-6"
                        >
                          &quot;{prompt.answer}&quot;
                        </Typography>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Interests */}
            <View className="mb-6">
              <Typography
                variant="label"
                color="muted"
                className="mb-2 uppercase tracking-wider text-xs"
              >
                Interests
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {profile.hobbies.slice(0, 5).map((hobby) => (
                  <Chip key={hobby} label={hobby} variant="outline" />
                ))}
                {profile.hobbies.length > 5 && (
                  <Chip
                    label={`+${profile.hobbies.length - 5}`}
                    variant="default"
                  />
                )}
              </View>
            </View>

            {/* Personality Traits */}
            <View className="mb-6">
              <Typography
                variant="label"
                color="muted"
                className="mb-2 uppercase tracking-wider text-xs"
              >
                Personality
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {profile.traits.slice(0, 4).map((trait) => (
                  <Badge
                    key={trait}
                    label={trait}
                    variant="default"
                    size="md"
                  />
                ))}
                {profile.traits.length > 4 && (
                  <Badge
                    label={`+${profile.traits.length - 4}`}
                    variant="default"
                    size="md"
                  />
                )}
              </View>
            </View>

            {/* Extra Info Section */}
            {profile.extra && Object.values(profile.extra).some(v => v && (Array.isArray(v) ? v.length > 0 : true)) && (
              <View className="mb-6">
                <Typography
                  variant="label"
                  color="muted"
                  className="mb-3 uppercase tracking-wider text-xs"
                >
                  More About Me
                </Typography>
                <View className="flex-row flex-wrap gap-2">
                  {profile.extra.work && (
                    <View className="flex-row items-center bg-surface/80 rounded-full px-3 py-2 border border-white/5">
                      <Briefcase size={14} color="#A78BFA" />
                      <Typography variant="caption" className="ml-2 text-white/80">
                        {profile.extra.work}
                      </Typography>
                    </View>
                  )}
                  {profile.extra.school && (
                    <View className="flex-row items-center bg-surface/80 rounded-full px-3 py-2 border border-white/5">
                      <GraduationCap size={14} color="#60A5FA" />
                      <Typography variant="caption" className="ml-2 text-white/80">
                        {profile.extra.school}
                      </Typography>
                    </View>
                  )}
                  {profile.extra.exercise && (
                    <View className="flex-row items-center bg-surface/80 rounded-full px-3 py-2 border border-white/5">
                      <Dumbbell size={14} color="#34D399" />
                      <Typography variant="caption" className="ml-2 text-white/80">
                        {profile.extra.exercise}
                      </Typography>
                    </View>
                  )}
                  {profile.extra.drinking && (
                    <View className="flex-row items-center bg-surface/80 rounded-full px-3 py-2 border border-white/5">
                      <Wine size={14} color="#F472B6" />
                      <Typography variant="caption" className="ml-2 text-white/80">
                        {profile.extra.drinking}
                      </Typography>
                    </View>
                  )}
                  {profile.extra.smoking && (
                    <View className="flex-row items-center bg-surface/80 rounded-full px-3 py-2 border border-white/5">
                      <Cigarette size={14} color="#FB923C" />
                      <Typography variant="caption" className="ml-2 text-white/80">
                        {profile.extra.smoking}
                      </Typography>
                    </View>
                  )}
                  {profile.extra.kids && (
                    <View className="flex-row items-center bg-surface/80 rounded-full px-3 py-2 border border-white/5">
                      <Baby size={14} color="#FCD34D" />
                      <Typography variant="caption" className="ml-2 text-white/80">
                        {profile.extra.kids}
                      </Typography>
                    </View>
                  )}
                  {profile.extra.religion && (
                    <View className="flex-row items-center bg-surface/80 rounded-full px-3 py-2 border border-white/5">
                      <Church size={14} color="#94A3B8" />
                      <Typography variant="caption" className="ml-2 text-white/80">
                        {profile.extra.religion}
                      </Typography>
                    </View>
                  )}
                  {profile.extra.lookingFor && profile.extra.lookingFor.length > 0 && (
                    <View className="flex-row items-center bg-surface/80 rounded-full px-3 py-2 border border-white/5">
                      <Users size={14} color="#E879F9" />
                      <Typography variant="caption" className="ml-2 text-white/80">
                        {profile.extra.lookingFor.join(", ")}
                      </Typography>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Photos Hidden Notice */}
            {!profile.isRevealed && (
              <View className="bg-primary/10 rounded-xl p-4 flex-row items-center border border-primary/20 mb-4">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <Heart size={20} color="#7C3AED" />
                </View>
                <View className="flex-1">
                  <Typography variant="label" className="mb-0.5">
                    Photos Hidden
                  </Typography>
                  <Typography variant="caption" color="muted">
                    Match & chat to unlock each other&apos;s photos
                  </Typography>
                </View>
              </View>
            )}

            {/* Bottom spacing for scrolling */}
            <View className="h-8" />
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    width: SCREEN_WIDTH - 24,
    height: SCREEN_HEIGHT * 0.72,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 2,
  },
  likeIndicator: {
    top: 60,
    left: 20,
    borderColor: "#14D679", // Neon Green
    backgroundColor: "rgba(20, 214, 121, 0.2)",
    transform: [{ rotate: "-12deg" }],
    shadowColor: "#14D679",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  nopeIndicator: {
    top: 60,
    right: 20,
    borderColor: "#FF4C61", // Neon Red
    backgroundColor: "rgba(255, 76, 97, 0.2)",
    transform: [{ rotate: "12deg" }],
    shadowColor: "#FF4C61",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  superLikeIndicator: {
    bottom: 100,
    alignSelf: "center",
    borderColor: "#6A1BFF", // Neon Purple
    backgroundColor: "rgba(106, 27, 255, 0.2)",
    shadowColor: "#6A1BFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});

export default SwipeCard;
