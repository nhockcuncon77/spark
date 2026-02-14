import React, { useState } from "react";
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
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { ChevronLeft, Mail, Sparkles, Send } from "lucide-react-native";
import { graphqlAuthService } from "../../services/graphql-auth";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function EmailLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isValidEmail = email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address");
      return;
    }

    if (!isValidEmail) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await graphqlAuthService.requestEmailLoginCode(
        email.trim().toLowerCase(),
      );

      if (result.success) {
        router.push(
          `/(auth)/verify-code?email=${encodeURIComponent(email.trim().toLowerCase())}` as Href,
        );
      } else {
        Alert.alert(
          "Failed to Send Code",
          result.error || "Could not send verification code. Please try again.",
        );
      }
    } catch (error) {
      console.error("Request code error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
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
                <Sparkles size={28} color="#FFD166" />
                <Typography variant="h1" className="text-3xl text-white ml-3">
                  Magic Link
                </Typography>
              </View>
              <Typography variant="body" className="text-white/50">
                We&apos;ll send you a verification code to sign in without a
                password
              </Typography>
            </Animated.View>

            {/* Form */}
            <View className="flex-1">
              {/* Email Input */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(200)}
                className="mb-6"
              >
                <Typography variant="label" className="mb-2 text-white/70">
                  Email Address
                </Typography>
                <View
                  className={`flex-row items-center bg-[#1A0138]/80 rounded-xl px-4 py-3.5 border ${focusedField === "email"
                      ? "border-primary"
                      : "border-white/[0.06]"
                    }`}
                >
                  <Mail size={20} color={focusedField === "email" ? "#8A3CFF" : "#6B6B80"} />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    autoFocus
                  />
                </View>
              </Animated.View>

              {/* Send Code Button */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(300)}
              >
                <View className="overflow-hidden rounded-2xl">
                  <LinearGradient
                    colors={
                      isLoading || !isValidEmail
                        ? ["#3D2066", "#3D2066"]
                        : ["#8A3CFF", "#B387FF"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Pressable
                      onPress={handleRequestCode}
                      disabled={isLoading || !isValidEmail}
                      className="h-14 flex-row items-center justify-center active:opacity-80"
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Send size={18} color="#FFFFFF" />
                          <Typography className="text-white font-bold text-base ml-2">
                            Send Verification Code
                          </Typography>
                        </>
                      )}
                    </Pressable>
                  </LinearGradient>
                </View>
              </Animated.View>

              {/* Info Card */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(400)}
                className="mt-6"
              >
                <View className="bg-[#1D0A3D]/80 border border-white/[0.06] rounded-xl p-4 flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-[#FFD166]/20 items-center justify-center mr-3 mt-0.5">
                    <Sparkles size={16} color="#FFD166" />
                  </View>
                  <View className="flex-1">
                    <Typography variant="label" className="text-white/80 mb-1">
                      How it works
                    </Typography>
                    <Typography variant="caption" className="text-white/50 leading-5">
                      Check your inbox for a 6-digit code. The code expires in 10 minutes.
                      No password needed – it&apos;s magic! ✨
                    </Typography>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Password Login Link */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(500)}
              className="flex-row justify-center mt-auto pt-8"
            >
              <Typography variant="body" className="text-white/50">
                Prefer to use a password?{" "}
              </Typography>
              <Pressable
                onPress={() => router.push("/(auth)/login" as Href)}
              >
                <Typography variant="body" className="text-primary font-semibold">
                  Sign In
                </Typography>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
