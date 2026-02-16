import { Redirect, Href } from "expo-router";
import { Platform } from "react-native";
import { useStore } from "../store/useStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading, isOnboardingComplete } = useStore();

  const loadingStyle =
    Platform.OS === "web"
      ? { flex: 1, minHeight: "100vh", backgroundColor: "#0B0223" }
      : undefined;

  if (isLoading) {
    return (
      <View
        style={loadingStyle}
        className="flex-1 bg-background items-center justify-center"
      >
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
