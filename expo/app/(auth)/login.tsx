import React, { useState } from "react";
import {
  View,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { ChevronLeft, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react-native";
import { graphqlAuthService } from "../../services/graphql-auth";
import { useStore } from "../../store/useStore";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await graphqlAuthService.loginWithPassword(
        email.trim(),
        password,
      );

      if (result.success && result.user && result.accessToken) {
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

        login(userProfile, result.accessToken);

        const status = graphqlAuthService.getOnboardingStatus(result.user);
        if (status.nextScreen) {
          router.replace(status.nextScreen as Href);
        } else {
          router.replace("/(tabs)/swipe" as Href);
        }
      } else {
        Alert.alert(
          "Login Failed",
          result.error || "Invalid email or password",
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = () => {
    router.push("/(auth)/email-login" as Href);
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
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-6 py-6">
              {/* Header */}
              <Animated.View
                entering={FadeInDown.duration(500)}
              >
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
                <Typography variant="h1" className="text-3xl text-white mb-2">
                  Welcome Back
                </Typography>
                <Typography variant="body" className="text-white/50">
                  Sign in to continue your journey
                </Typography>
              </Animated.View>

              {/* Form */}
              <View className="flex-1">
                {/* Email Input */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(200)}
                  className="mb-5"
                >
                  <Typography variant="label" className="mb-2 text-white/70">
                    Email
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
                    />
                  </View>
                </Animated.View>

                {/* Password Input */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(300)}
                  className="mb-8"
                >
                  <Typography variant="label" className="mb-2 text-white/70">
                    Password
                  </Typography>
                  <View
                    className={`flex-row items-center bg-[#1A0138]/80 rounded-xl px-4 py-3.5 border ${focusedField === "password"
                        ? "border-primary"
                        : "border-white/[0.06]"
                      }`}
                  >
                    <Lock size={20} color={focusedField === "password" ? "#8A3CFF" : "#6B6B80"} />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="p-1"
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#6B6B80" />
                      ) : (
                        <Eye size={20} color="#6B6B80" />
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Login Button with Gradient */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(400)}
                >
                  <View className="overflow-hidden rounded-2xl">
                    <LinearGradient
                      colors={isLoading || !email.trim() || !password.trim() ? ["#3D2066", "#3D2066"] : ["#8A3CFF", "#B387FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Pressable
                        onPress={handleLogin}
                        disabled={isLoading}
                        className="h-14 items-center justify-center active:opacity-80"
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Typography className="text-white font-bold text-base">
                            Sign In
                          </Typography>
                        )}
                      </Pressable>
                    </LinearGradient>
                  </View>
                </Animated.View>

                {/* Divider */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(500)}
                  className="flex-row items-center my-8"
                >
                  <View className="flex-1 h-[1px] bg-white/10" />
                  <Typography variant="caption" className="mx-4 text-white/30">
                    or
                  </Typography>
                  <View className="flex-1 h-[1px] bg-white/10" />
                </Animated.View>

                {/* Email Login Code Button */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(600)}
                >
                  <Pressable
                    onPress={handleEmailLogin}
                    className="h-14 rounded-2xl bg-white/[0.08] border border-white/[0.1] flex-row items-center justify-center active:bg-white/[0.12]"
                  >
                    <Sparkles size={20} color="#FFD166" />
                    <Typography className="text-white font-semibold ml-2">
                      Sign in with Email Code
                    </Typography>
                  </Pressable>
                </Animated.View>
              </View>

              {/* Sign Up Link */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(700)}
                className="flex-row justify-center mt-8"
              >
                <Typography variant="body" className="text-white/50">
                  Don&apos;t have an account?{" "}
                </Typography>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/signup" as Href)}
                >
                  <Typography variant="body" className="text-primary font-semibold">
                    Sign Up
                  </Typography>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
