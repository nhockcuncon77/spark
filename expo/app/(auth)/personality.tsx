import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { LikertScale } from "../../components/ui/LikertScale";
import { ONBOARDING_QUESTIONS } from "../../constants/mockData";
import { useStore } from "../../store/useStore";
import { ChevronLeft } from "lucide-react-native";
import { graphqlAuthService } from "../../services/graphql-auth";
import { GradientBackground } from "../../components/ui/GradientBackground";

export default function PersonalityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    updateOnboardingData,
    onboardingData,
    completeOnboarding,
    user,
    setUser,
  } = useStore();

  // Initialize from store if available
  const [answers, setAnswers] = useState<Record<number, number>>(
    onboardingData.personalityTraits
      ? Object.entries(onboardingData.personalityTraits).reduce(
        (acc, [key, value]) => {
          const questionIndex = ONBOARDING_QUESTIONS.findIndex(
            (q) => q.question === key,
          );
          if (questionIndex !== -1) {
            acc[ONBOARDING_QUESTIONS[questionIndex].id] = value;
          }
          return acc;
        },
        {} as Record<number, number>,
      )
      : {},
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleAnswerChange = (questionId: number, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const isComplete = ONBOARDING_QUESTIONS.every(
    (q) => answers[q.id] !== undefined,
  );
  const progress = Object.keys(answers).length / ONBOARDING_QUESTIONS.length;

  const handleBack = () => {
    // Save current progress
    const traits = ONBOARDING_QUESTIONS.reduce(
      (acc, q) => {
        if (answers[q.id] !== undefined) {
          acc[q.question] = answers[q.id];
        }
        return acc;
      },
      {} as Record<string, number>,
    );
    updateOnboardingData({ personalityTraits: traits });

    router.back();
  };

  const handleContinue = async () => {
    if (!isComplete) {
      Alert.alert("Almost there", "Please answer all questions to continue.");
      return;
    }

    setIsLoading(true);
    try {
      // Convert answers to personality traits format for API
      const traitsForApi = ONBOARDING_QUESTIONS.map((q) => ({
        key: q.question,
        value: answers[q.id],
      }));

      // Convert to local traits format
      const traits = ONBOARDING_QUESTIONS.reduce(
        (acc, q) => {
          acc[q.question] = answers[q.id];
          return acc;
        },
        {} as Record<string, number>,
      );

      // Save to backend
      const result = await graphqlAuthService.updateMe({
        personality_traits: traitsForApi,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save personality traits");
      }

      // Save to onboarding data
      updateOnboardingData({ personalityTraits: traits });

      // Update user profile with onboarding data
      if (user && result.user) {
        setUser({
          ...user,
          hobbies: onboardingData.hobbies || [],
          personalityTraits: traits,
        });
      }

      // Check what's next in onboarding
      if (result.user) {
        const status = graphqlAuthService.getOnboardingStatus(result.user);
        if (status.needsPhotos) {
          router.replace("/(auth)/photos" as Href);
        } else if (status.isComplete) {
          completeOnboarding();
          router.replace("/(tabs)/swipe" as Href);
        } else {
          router.replace("/(tabs)/swipe" as Href);
        }
      }
    } catch (error) {
      console.error("Save personality error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Personality Quiz?",
      "Your matches will be less accurate without this. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          style: "destructive",
          onPress: () => {
            completeOnboarding();
            router.replace("/(tabs)/swipe" as Href);
          },
        },
      ],
    );
  };

  return (
    <GradientBackground>
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-6 py-4">
          {/* Back Button & Progress Indicators */}
          <View className="flex-row items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onPress={handleBack}
              icon={<ChevronLeft size={24} color="#E6E6F0" />}
              className="px-0 -ml-2"
            />
            <View className="flex-1 flex-row justify-center mr-8">
              <View className="flex-row gap-2">
                <View className="w-8 h-1 bg-primary rounded-full" />
                <View className="w-8 h-1 bg-primary rounded-full" />
                <View className="w-8 h-1 bg-surface-elevated rounded-full" />
              </View>
            </View>
          </View>

          <Typography variant="h1" className="mb-2">
            How do you tick?
          </Typography>
          <Typography variant="body" color="muted">
            Be honest. These answers help the AI find your best matches.
          </Typography>

          {/* Progress Bar */}
          <View className="h-1.5 bg-surface-elevated mt-4 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
          <Typography
            variant="caption"
            color="muted"
            className="mt-2 text-right"
          >
            {Object.keys(answers).length} of {ONBOARDING_QUESTIONS.length}{" "}
            answered
          </Typography>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 140 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {ONBOARDING_QUESTIONS.map((q, index) => (
            <View key={q.id} className="mb-8">
              <Typography variant="label" color="muted" className="mb-2">
                Question {index + 1}
              </Typography>
              <LikertScale
                question={q.question}
                value={answers[q.id] ?? null}
                onChange={(val) => handleAnswerChange(q.id, val)}
              />
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View
          className="absolute bottom-0 left-0 right-0 p-6 border-t border-surface-elevated bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <Button
            variant="primary"
            size="lg"
            onPress={handleContinue}
            disabled={!isComplete}
            className="w-full mb-3"
          >
            {isComplete ? "Complete Setup" : "Answer All Questions"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onPress={handleSkip}
            className="w-full"
          >
            <Typography variant="caption" color="muted">
              Skip for now
            </Typography>
          </Button>
        </View>
      </View>
    </GradientBackground>
  );
}
