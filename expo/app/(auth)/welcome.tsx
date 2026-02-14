import React, { useEffect } from "react";
import { View, Image, Dimensions, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { UserPlus, LogIn } from "lucide-react-native";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Constants from "expo-constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const version = Constants.expoConfig?.version ?? "(latest)";

// Shooting Star Component
const ShootingStar = ({
  delay = 0,
  duration = 1500,
  startX = 0,
  startY = 0,
}) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      translateX.value = startX;
      translateY.value = startY;
      opacity.value = 0;

      translateX.value = withDelay(
        delay,
        withRepeat(
          withTiming(startX + 200, {
            duration,
            easing: Easing.out(Easing.ease),
          }),
          -1,
          false,
        ),
      );

      translateY.value = withDelay(
        delay,
        withRepeat(
          withTiming(startY + 200, {
            duration,
            easing: Easing.out(Easing.ease),
          }),
          -1,
          false,
        ),
      );

      opacity.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: duration * 0.3,
            easing: Easing.out(Easing.ease),
          }),
          -1,
          false,
        ),
      );
    };

    animate();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 2,
          height: 60,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={["transparent", "#FFFFFF", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          width: "100%",
          height: "100%",
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </Animated.View>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/(auth)/onboarding" as Href);
  };

  const handleSignIn = () => {
    router.push("/(auth)/login" as Href);
  };

  // Generate shooting stars with random positions and delays
  const stars = [
    { delay: 0, duration: 1800, startX: -20, startY: -50 },
    { delay: 600, duration: 2000, startX: SCREEN_WIDTH * 0.2, startY: -80 },
    { delay: 1200, duration: 1600, startX: SCREEN_WIDTH * 0.45, startY: -30 },
    { delay: 300, duration: 2200, startX: SCREEN_WIDTH * 0.05, startY: -100 },
    { delay: 900, duration: 1900, startX: SCREEN_WIDTH * 0.3, startY: -60 },
    { delay: 1500, duration: 1700, startX: -10, startY: -40 },
  ];

  return (
    <GradientBackground>
      {/* Shooting Stars Background */}
      <View style={{ position: "absolute", width: "100%", height: "100%" }}>
        {stars.map((star, index) => (
          <ShootingStar
            key={index}
            delay={star.delay}
            duration={star.duration}
            startX={star.startX}
            startY={star.startY}
          />
        ))}
      </View>

      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-12 pb-8">
          {/* Logo Section */}
          <Animated.View
            entering={FadeInDown.duration(800).delay(200)}
            className="items-center"
          >
            <View className="relative items-center justify-center mb-4">
              <Image
                source={require("../../assets/main-trans.png")}
                style={{ width: 120, height: 60 }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Hero Section */}
          <View className="flex-1 justify-center items-center">
            <Animated.View
              entering={FadeInUp.duration(700).delay(400)}
              className="items-center mb-8"
            >
              <Typography
                variant="h1"
                className="text-center text-4xl text-white mb-2"
                style={{ fontWeight: "700", letterSpacing: -0.5 }}
              >
                Meet the person first.
              </Typography>
              <LinearGradient
                colors={["#7C3AED", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  marginTop: 4,
                }}
              >
                <Typography
                  variant="h1"
                  className="text-4xl text-white"
                  style={{ fontWeight: "700", letterSpacing: -0.5 }}
                >
                  Looks later.
                </Typography>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(700).delay(600)}>
              <Typography
                variant="body"
                className="text-center text-white/60 leading-7 px-4"
                style={{ fontSize: 16 }}
              >
                Connect through personality and shared interests.{"\n"}
                Photos reveal when you&apos;re both ready.
              </Typography>
            </Animated.View>
          </View>

          {/* CTA Buttons */}
          <Animated.View
            entering={FadeInUp.duration(700).delay(800)}
            className="w-full"
          >
            {/* Primary CTA */}
            <Pressable onPress={handleGetStarted}>
              <LinearGradient
                colors={["#7C3AED", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16 }}
              >
                <View className="h-14 flex-row items-center justify-center">
                  <UserPlus size={20} color="#FFFFFF" />
                  <Typography className="text-white font-bold text-base ml-2">
                    Get Started
                  </Typography>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Secondary Button */}
            <Pressable
              onPress={handleSignIn}
              className="h-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex-row items-center justify-center mt-4"
            >
              <LogIn size={20} color="#E6E6F0" />
              <Typography className="text-white font-semibold ml-2">
                I already have an account
              </Typography>
            </Pressable>

            <Typography
              variant="caption"
              className="text-center mt-6 text-white/25 leading-5"
            >
              By continuing, you agree to our Terms of Service{"\n"}and Privacy
              Policy.{"\n"}
              {"\n"}Spark v{version} | Made with ❤️ by MelloB
            </Typography>
          </Animated.View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
