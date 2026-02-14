import React, { useState, useRef } from "react";
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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import {
  ChevronLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Calendar,
  Check,
} from "lucide-react-native";
import {
  graphqlAuthService,
  CreateUserInput,
} from "../../services/graphql-auth";
import { useStore } from "../../store/useStore";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";

// Step indicator component
const StepIndicator = ({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) => (
  <View className="flex-row justify-center mb-6 gap-2">
    {Array.from({ length: totalSteps }).map((_, index) => (
      <View
        key={index}
        className={`h-1 rounded-full ${index <= currentStep ? "bg-primary" : "bg-white/20"
          }`}
        style={{ width: index <= currentStep ? 32 : 24 }}
      />
    ))}
  </View>
);

// Password strength indicator
const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = () => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: "Weak", color: "#FF4C6D" };
    if (score <= 3) return { level: 2, label: "Fair", color: "#FFB067" };
    if (score <= 4) return { level: 3, label: "Good", color: "#FFD166" };
    return { level: 4, label: "Strong", color: "#47FFA8" };
  };

  const strength = getStrength();
  if (!password) return null;

  return (
    <View className="mt-2">
      <View className="flex-row gap-1 mb-1">
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            className="flex-1 h-1 rounded-full"
            style={{
              backgroundColor:
                level <= strength.level
                  ? strength.color
                  : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </View>
      <Typography variant="caption" style={{ color: strength.color }}>
        {strength.label}
      </Typography>
    </View>
  );
};

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const genderOptions = [
    { value: "male", label: "Male", emoji: "👨" },
    { value: "female", label: "Female", emoji: "👩" },
    { value: "other", label: "Other", emoji: "🧑" },
  ];

  // Calculate which step user is on based on filled fields
  const getCurrentStep = () => {
    if (!firstName || !lastName) return 0;
    if (!email) return 1;
    if (!dob) return 2;
    if (!gender) return 2;
    if (!password || !confirmPassword) return 3;
    return 4;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (birthDate: Date) => {
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

  const validateForm = (): string | null => {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!email.trim()) return "Email is required";
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!dob) return "Date of birth is required";
    if (!gender) return "Please select your gender";
    if (calculateAge(dob) < 18) return "You must be 18 or older to sign up";
    if (!acceptedTerms)
      return "You must accept the Terms of Service and Privacy Policy";

    return null;
  };

  const handleSignup = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

    setIsLoading(true);
    try {
      const input: CreateUserInput = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        dob: dob!.toISOString(),
        gender: gender || undefined,
      };

      const result = await graphqlAuthService.createUser(input);

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
          "Signup Failed",
          result.error || "Could not create account. Please try again.",
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const isFormComplete = !validateForm();

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
              <Animated.View entering={FadeInDown.duration(500)}>
                <Pressable
                  onPress={handleBack}
                  className="flex-row items-center mb-4 p-2 -ml-2 rounded-full self-start active:bg-white/10"
                >
                  <ChevronLeft size={24} color="#E6E6F0" />
                  <Typography variant="body" className="ml-1 text-white/70">
                    Back
                  </Typography>
                </Pressable>
              </Animated.View>

              {/* Step Indicator */}
              <Animated.View entering={FadeIn.duration(600).delay(100)}>
                <StepIndicator currentStep={getCurrentStep()} totalSteps={5} />
              </Animated.View>

              {/* Title */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(100)}
                className="mb-6"
              >
                <Typography variant="h1" className="text-3xl text-white mb-2">
                  Create Account
                </Typography>
                <Typography variant="body" className="text-white/50">
                  Start your journey to meaningful connections
                </Typography>
              </Animated.View>

              {/* Form */}
              <View className="flex-1">
                {/* Name Row */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(200)}
                  className="flex-row gap-3 mb-5"
                >
                  <View className="flex-1">
                    <Typography variant="label" className="mb-2 text-white/70">
                      First Name
                    </Typography>
                    <View
                      className={`flex-row items-center bg-[#1A0138]/80 rounded-xl px-4 py-3.5 border ${focusedField === "firstName"
                          ? "border-primary"
                          : "border-white/[0.06]"
                        }`}
                    >
                      <User
                        size={18}
                        color={
                          focusedField === "firstName" ? "#8A3CFF" : "#6B6B80"
                        }
                      />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="First"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={firstName}
                        onChangeText={setFirstName}
                        onFocus={() => setFocusedField("firstName")}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="words"
                        autoComplete="given-name"
                      />
                      {firstName.trim() && <Check size={16} color="#47FFA8" />}
                    </View>
                  </View>

                  <View className="flex-1">
                    <Typography variant="label" className="mb-2 text-white/70">
                      Last Name
                    </Typography>
                    <View
                      className={`flex-row items-center bg-[#1A0138]/80 rounded-xl px-4 py-3.5 border ${focusedField === "lastName"
                          ? "border-primary"
                          : "border-white/[0.06]"
                        }`}
                    >
                      <TextInput
                        className="flex-1 text-white text-base"
                        placeholder="Last"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={lastName}
                        onChangeText={setLastName}
                        onFocus={() => setFocusedField("lastName")}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="words"
                        autoComplete="family-name"
                      />
                      {lastName.trim() && <Check size={16} color="#47FFA8" />}
                    </View>
                  </View>
                </Animated.View>

                {/* Email Input */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(300)}
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
                    <Mail
                      size={18}
                      color={focusedField === "email" ? "#8A3CFF" : "#6B6B80"}
                    />
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
                    {email.includes("@") && email.includes(".") && (
                      <Check size={16} color="#47FFA8" />
                    )}
                  </View>
                </Animated.View>

                {/* Date of Birth */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(400)}
                  className="mb-5"
                >
                  <Typography variant="label" className="mb-2 text-white/70">
                    Date of Birth
                  </Typography>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className={`flex-row items-center bg-[#1A0138]/80 rounded-xl px-4 py-3.5 border ${showDatePicker ? "border-primary" : "border-white/[0.06]"
                      }`}
                  >
                    <Calendar
                      size={18}
                      color={showDatePicker ? "#8A3CFF" : "#6B6B80"}
                    />
                    <Typography
                      className={`flex-1 ml-3 text-base ${dob ? "text-white" : "text-white/30"
                        }`}
                    >
                      {dob ? formatDate(dob) : "Select your birthday"}
                    </Typography>
                    {dob && calculateAge(dob) >= 18 && (
                      <Check size={16} color="#47FFA8" />
                    )}
                  </Pressable>
                  <Typography variant="caption" className="mt-2 text-white/40">
                    You must be 18 or older to use Spark
                  </Typography>

                  {showDatePicker && (
                    <View className="mt-3 bg-[#1A0138]/80 rounded-xl p-4 border border-white/[0.06]">
                      <DateTimePicker
                        value={dob || new Date(2000, 0, 1)}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(1920, 0, 1)}
                        themeVariant="dark"
                      />
                      {Platform.OS === "ios" && (
                        <Pressable
                          onPress={() => setShowDatePicker(false)}
                          className="mt-3 py-2 items-center"
                        >
                          <Typography className="text-primary font-semibold">
                            Done
                          </Typography>
                        </Pressable>
                      )}
                    </View>
                  )}
                </Animated.View>

                {/* Gender Selection */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(500)}
                  className="mb-5"
                >
                  <Typography variant="label" className="mb-2 text-white/70">
                    Gender
                  </Typography>
                  <View className="flex-row gap-3">
                    {genderOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setGender(option.value)}
                        className="flex-1"
                      >
                        <LinearGradient
                          colors={
                            gender === option.value
                              ? ["#8A3CFF20", "#B387FF10"]
                              : ["#1A0138", "#1A0138"]
                          }
                          className="rounded-xl"
                          style={{ borderRadius: 12 }}
                        >
                          <View
                            className={`py-4 rounded-xl items-center justify-center border ${gender === option.value
                                ? "border-primary"
                                : "border-white/[0.06]"
                              }`}
                          >
                            <Typography className="text-2xl mb-1">
                              {option.emoji}
                            </Typography>
                            <Typography
                              variant="label"
                              className={
                                gender === option.value
                                  ? "text-primary font-semibold"
                                  : "text-white/60"
                              }
                            >
                              {option.label}
                            </Typography>
                          </View>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>

                {/* Password Input */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(600)}
                  className="mb-4"
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
                    <Lock
                      size={18}
                      color={
                        focusedField === "password" ? "#8A3CFF" : "#6B6B80"
                      }
                    />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="At least 8 characters"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
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
                  <PasswordStrength password={password} />
                </Animated.View>

                {/* Confirm Password */}
                <Animated.View
                  entering={FadeInUp.duration(600).delay(700)}
                  className="mb-8"
                >
                  <Typography variant="label" className="mb-2 text-white/70">
                    Confirm Password
                  </Typography>
                  <View
                    className={`flex-row items-center bg-[#1A0138]/80 rounded-xl px-4 py-3.5 border ${focusedField === "confirmPassword"
                        ? "border-primary"
                        : confirmPassword && password === confirmPassword
                          ? "border-[#47FFA8]"
                          : "border-white/[0.06]"
                      }`}
                  >
                    <Lock
                      size={18}
                      color={
                        focusedField === "confirmPassword"
                          ? "#8A3CFF"
                          : "#6B6B80"
                      }
                    />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="Confirm your password"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                    />
                    {confirmPassword && password === confirmPassword && (
                      <Check size={16} color="#47FFA8" />
                    )}
                  </View>
                </Animated.View>

                {/* Create Account Button */}
                <Animated.View entering={FadeInUp.duration(600).delay(800)}>
                  <View className="overflow-hidden rounded-2xl">
                    <LinearGradient
                      colors={
                        isLoading || !isFormComplete
                          ? ["#3D2066", "#3D2066"]
                          : ["#8A3CFF", "#B387FF"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Pressable
                        onPress={handleSignup}
                        disabled={isLoading}
                        className="h-14 items-center justify-center active:opacity-80"
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Typography className="text-white font-bold text-base">
                            Create Account
                          </Typography>
                        )}
                      </Pressable>
                    </LinearGradient>
                  </View>
                </Animated.View>
              </View>

              {/* Sign In Link */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(900)}
                className="flex-row justify-center mt-8"
              >
                <Typography variant="body" className="text-white/50">
                  Already have an account?{" "}
                </Typography>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/login" as Href)}
                >
                  <Typography
                    variant="body"
                    className="text-primary font-semibold"
                  >
                    Sign In
                  </Typography>
                </TouchableOpacity>
              </Animated.View>

              {/* Terms Acceptance Checkbox */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(850)}
                className="mt-6"
              >
                <Pressable
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  className="flex-row items-start gap-3"
                >
                  <View
                    className={`w-6 h-6 rounded-md border-2 items-center justify-center mt-0.5 ${acceptedTerms
                        ? "bg-primary border-primary"
                        : "bg-white/10 border-white/50"
                      }`}
                  >
                    {acceptedTerms && <Check size={14} color="white" />}
                  </View>
                  <View className="flex-1">
                    <Typography
                      variant="body"
                      className="text-white/70 text-sm leading-5"
                    >
                      I agree to the{" "}
                      <Typography
                        variant="body"
                        className="text-primary font-semibold text-sm"
                        onPress={() =>
                          Linking.openURL(
                            "https://spark-frontend-tlcj.onrender.com/docs/terms",
                          )
                        }
                      >
                        Terms of Service
                      </Typography>{" "}
                      and{" "}
                      <Typography
                        variant="body"
                        className="text-primary font-semibold text-sm"
                        onPress={() =>
                          Linking.openURL(
                            "https://spark-frontend-tlcj.onrender.com/docs/privacy",
                          )
                        }
                      >
                        Privacy Policy
                      </Typography>
                      . I understand there is zero tolerance for objectionable
                      content or abusive behavior.
                    </Typography>
                  </View>
                </Pressable>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
