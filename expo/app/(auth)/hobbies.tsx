import React, { useState } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { HOBBIES } from "../../constants/mockData";
import { useStore } from "../../store/useStore";
import { ChevronLeft } from "lucide-react-native";
import { graphqlAuthService } from "../../services/graphql-auth";
import { authService } from "../../services/auth";

export default function HobbiesScreen() {
  const router = useRouter();
  const {
    updateOnboardingData,
    onboardingData,
    setOnboardingStep,
    user,
    setUser,
    logout,
  } = useStore();

  // Initialize from store if available
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(
    onboardingData.hobbies || [],
  );
  const [isLoading, setIsLoading] = useState(false);

  const toggleHobby = (hobbyLabel: string) => {
    if (selectedHobbies.includes(hobbyLabel)) {
      setSelectedHobbies(selectedHobbies.filter((h) => h !== hobbyLabel));
    } else {
      if (selectedHobbies.length < 5) {
        setSelectedHobbies([...selectedHobbies, hobbyLabel]);
      }
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // Save hobbies to backend
      const result = await graphqlAuthService.updateMe({
        hobbies: selectedHobbies,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save hobbies");
      }

      // Update local state
      updateOnboardingData({ hobbies: selectedHobbies });
      setOnboardingStep(2);

      if (user && result.user) {
        setUser({
          ...user,
          hobbies: result.user.hobbies,
        });
      }

      // Navigate to personality questionnaire
      router.push("/(auth)/personality" as Href);
    } catch (error) {
      console.error("Save hobbies error:", error);

      // Check for invalid token error and log out
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("invalid token")) {
        try {
          await authService.signOut();
        } catch (signOutError) {
          console.error("Sign out error:", signOutError);
        }
        logout();
        router.replace("/(auth)/welcome");
        return;
      }

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

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 py-6">
        {/* Back Button */}
        <View className="flex-row items-center mb-6">
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
              <View className="w-8 h-1 bg-surface-elevated rounded-full" />
              <View className="w-8 h-1 bg-surface-elevated rounded-full" />
            </View>
          </View>
        </View>

        {/* Header */}
        <View className="mb-8">
          <Typography variant="h1" className="mb-2">
            What are you into?
          </Typography>
          <Typography variant="body" color="muted">
            Pick up to 5 hobbies. This helps us find people with shared
            interests.
          </Typography>
        </View>

        {/* Hobbies Grid */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="flex-row flex-wrap gap-3">
            {HOBBIES.map((hobby) => {
              const isSelected = selectedHobbies.includes(hobby.label);
              return (
                <Chip
                  key={hobby.id}
                  label={hobby.label}
                  icon={<Typography>{hobby.icon}</Typography>}
                  variant={isSelected ? "primary" : "default"}
                  selected={isSelected}
                  onPress={() => toggleHobby(hobby.label)}
                  className="py-2 px-4"
                />
              );
            })}
          </View>
        </ScrollView>

        {/* Footer Action */}
        <View className="absolute bottom-8 left-6 right-6 bg-background pt-4">
          <Typography
            variant="caption"
            color="muted"
            className="text-center mb-3"
          >
            {selectedHobbies.length === 0
              ? "Select at least 1 hobby"
              : `${selectedHobbies.length} of 5 selected`}
          </Typography>
          <Button
            variant="primary"
            size="lg"
            onPress={handleContinue}
            disabled={selectedHobbies.length === 0 || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              "Continue"
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
