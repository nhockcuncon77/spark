import { Stack } from "expo-router";
import { View } from "react-native";

export default function AuthLayout() {
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0B0B10" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="welcome"
          options={{
            animation: "fade",
          }}
        />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="email-login" />
        <Stack.Screen name="verify-code" />
        <Stack.Screen name="hobbies" />
        <Stack.Screen name="personality" />
        <Stack.Screen name="photos" />
      </Stack>
    </View>
  );
}
