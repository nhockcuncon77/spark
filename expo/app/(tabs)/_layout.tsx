import { Tabs } from "expo-router";
import React from "react";
import {
  Sparkles,
  MessageCircle,
  User,
  Users,
  Heart,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Use insets.bottom for devices with gesture navigation (provides proper padding)
  // Use minimum of 48 for devices without gestures (3-button navigation on older Android)
  // Some Android versions with 3-button nav report insets.bottom as 0 or very small
  const bottomPadding = Math.max(insets.bottom, 48);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: "rgba(255, 255, 255, 0.05)",
          borderTopWidth: 1,
          height: 60 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={["rgba(23, 16, 46, 0.95)", "rgba(10, 3, 20, 0.5)"]}
            style={{ flex: 1 }}
          />
        ),
        tabBarActiveTintColor: "#A78BFA",
        tabBarInactiveTintColor: "#6E6A85",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="swipe"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="maytri"
        options={{
          title: "Maytri",
          tabBarIcon: ({ color }) => <Sparkles size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Community",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      {/* Hide the old index (browse) screen */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
