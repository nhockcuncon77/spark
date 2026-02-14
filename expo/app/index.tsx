import { Redirect, Href } from "expo-router";
import { useStore } from "../store/useStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading, isOnboardingComplete } = useStore();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // Route based on auth state
  if (isAuthenticated) {
    if (isOnboardingComplete) {
      return <Redirect href={"/(tabs)/swipe" as Href} />;
    }
    // Continue onboarding
    return <Redirect href={"/(auth)/hobbies" as Href} />;
  }

  // Not authenticated - go to welcome
  return <Redirect href={"/(auth)/welcome" as Href} />;
}
