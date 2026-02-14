import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { ChevronLeft, Mail, RefreshCw, Shield, Sparkles, Check } from "lucide-react-native";
import { graphqlAuthService } from "../../services/graphql-auth";
import { useStore } from "../../store/useStore";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

const CODE_LENGTH = 6;

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { login } = useStore();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Pulse animation for success
  const successScale = useSharedValue(1);

  useEffect(() => {
    if (isSuccess) {
      successScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
    }
  }, [isSuccess]);

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      handleVerify();
    }
  }, [code]);

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) {
      Alert.alert("Invalid Code", "Please enter the complete 6-digit code");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email not found. Please go back and try again.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await graphqlAuthService.verifyEmailLoginCode(email, code);

      if (result.success && result.user && result.accessToken) {
        setIsSuccess(true);

        const userProfile = {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          bio: result.user.bio || "",
          hobbies: result.user.hobbies || [],
          personalityTraits: result.user.personality_traits
            ? Object.fromEntries(
              result.user.personality_traits.map((t) => [t.key, t.value]),
            )
            : {},
          photos: result.user.photos || [],
          isVerified: result.user.is_verified,
          isPhotosRevealed: false,
        };

        // Small delay for success animation
        setTimeout(() => {
          login(userProfile, result.accessToken!);

          const status = graphqlAuthService.getOnboardingStatus(result.user!);
          if (status.nextScreen) {
            router.replace(status.nextScreen as Href);
          } else {
            router.replace("/(tabs)/swipe" as Href);
          }
        }, 600);
      } else {
        setCode("");
        Alert.alert(
          "Verification Failed",
          result.error || "Invalid or expired code. Please try again.",
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      setCode("");
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;

    setIsResending(true);
    try {
      const result = await graphqlAuthService.requestEmailLoginCode(email);

      if (result.success) {
        Alert.alert(
          "Code Sent",
          "A new verification code has been sent to your email.",
        );
        setResendCooldown(60);
        setCode("");
      } else {
        Alert.alert(
          "Failed to Resend",
          result.error || "Could not send code. Please try again.",
        );
      }
    } catch (error) {
      console.error("Resend error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCodeChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    if (numericText.length <= CODE_LENGTH) {
      setCode(numericText);
    }
  };

  // Render individual code boxes with glow
  const renderCodeBoxes = () => {
    const boxes = [];
    for (let i = 0; i < CODE_LENGTH; i++) {
      const digit = code[i] || "";
      const isFocused = code.length === i;
      const isFilled = digit !== "";

      boxes.push(
        <Animated.View
          key={i}
          entering={FadeInUp.duration(400).delay(i * 50)}
          className={`w-12 h-14 rounded-xl items-center justify-center mx-1.5 border-2 ${isSuccess
            ? "bg-[#47FFA8]/20 border-[#47FFA8]"
            : isFocused
              ? "bg-primary/20 border-primary"
              : isFilled
                ? "bg-[#1A0138]/80 border-primary/50"
                : "bg-[#1A0138]/80 border-white/[0.1]"
            }`}
          style={isSuccess ? successStyle : undefined}
        >
          {isSuccess && isFilled ? (
            <Check size={20} color="#47FFA8" />
          ) : (
            <Typography variant="h2" className="text-2xl text-white">
              {digit}
            </Typography>
          )}
        </Animated.View>,
      );
    }
    return boxes;
  };

  // Format countdown as mm:ss
  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 px-6 py-6">
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(500)}>
              <Pressable
                onPress={handleBack}
                className="flex-row items-center mb-6 p-2 -ml-2 rounded-full self-start active:bg-white/10"
              >
                <ChevronLeft size={24} color="#E6E6F0" />
                <Typography variant="body" className="ml-1 text-white/70">
                  Back
                </Typography>
              </Pressable>
            </Animated.View>

            {/* Title */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(100)}
              className="mb-8"
            >
              <View className="flex-row items-center mb-2">
                <Shield size={28} color="#8A3CFF" />
                <Typography variant="h1" className="text-3xl text-white ml-3">
                  Verification
                </Typography>
              </View>
              <Typography variant="body" className="text-white/50">
                We sent a 6-digit code to
              </Typography>
              <View className="flex-row items-center mt-1">
                <Mail size={14} color="#8A3CFF" />
                <Typography variant="label" className="text-primary ml-2 font-semibold">
                  {email}
                </Typography>
              </View>
            </Animated.View>

            {/* Code Input */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(200)}
              className="items-center mb-8"
            >
              <View className="flex-row justify-center">{renderCodeBoxes()}</View>

              {/* Hidden actual input */}
              <TextInput
                ref={inputRef}
                className="absolute opacity-0 w-full h-14"
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                autoComplete="one-time-code"
              />
            </Animated.View>

            {/* Verify Button */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(300)}
            >
              <View className="overflow-hidden rounded-2xl">
                <LinearGradient
                  colors={
                    isLoading || code.length !== CODE_LENGTH
                      ? ["#3D2066", "#3D2066"]
                      : isSuccess
                        ? ["#47FFA8", "#2DD4BF"]
                        : ["#8A3CFF", "#B387FF"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Pressable
                    onPress={handleVerify}
                    disabled={isLoading || code.length !== CODE_LENGTH}
                    className="h-14 flex-row items-center justify-center active:opacity-80"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : isSuccess ? (
                      <>
                        <Check size={20} color="#FFFFFF" />
                        <Typography className="text-white font-bold text-base ml-2">
                          Verified!
                        </Typography>
                      </>
                    ) : (
                      <Typography className="text-white font-bold text-base">
                        Verify Code
                      </Typography>
                    )}
                  </Pressable>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* Resend Code */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(400)}
              className="items-center mt-8"
            >
              {resendCooldown > 0 ? (
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-white/[0.08] items-center justify-center mr-2">
                    <Typography variant="caption" className="text-white/50">
                      {formatCooldown(resendCooldown)}
                    </Typography>
                  </View>
                  <Typography variant="body" className="text-white/40">
                    Resend available soon
                  </Typography>
                </View>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={isResending}
                  className="flex-row items-center p-2 rounded-full active:bg-white/10"
                >
                  {isResending ? (
                    <ActivityIndicator color="#8A3CFF" size="small" />
                  ) : (
                    <>
                      <RefreshCw size={16} color="#8A3CFF" />
                      <Typography variant="body" className="text-primary ml-2 font-semibold">
                        Resend Code
                      </Typography>
                    </>
                  )}
                </Pressable>
              )}
            </Animated.View>

            {/* Info Card */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(500)}
              className="mt-8"
            >
              <View className="bg-[#1D0A3D]/80 border border-white/[0.06] rounded-xl p-4 flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-[#FFD166]/20 items-center justify-center mr-3 mt-0.5">
                  <Sparkles size={16} color="#FFD166" />
                </View>
                <View className="flex-1">
                  <Typography variant="label" className="text-white/80 mb-1">
                    Can&apos;t find the code?
                  </Typography>
                  <Typography variant="caption" className="text-white/50 leading-5">
                    Check your spam folder or request a new code. The code expires in 10 minutes.
                  </Typography>
                </View>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
