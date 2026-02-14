import React from "react";
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  Text,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface AvatarProps {
  source?: string | any; // URI or require()
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string;
  style?: ViewStyle;
  glow?: boolean;
  locked?: boolean;
  bordered?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  className,
  size = "md",
  fallback = "?",
  style,
  glow = false,
  locked = false,
  bordered = true,
}) => {
  const getDimensions = () => {
    switch (size) {
      case "sm":
        return 32;
      case "lg":
        return 80;
      case "xl":
        return 120;
      default:
        return 56; // md
    }
  };

  const dimension = getDimensions();
  const radius = dimension / 2;

  const InnerContent = () => (
    <View
      style={[
        styles.innerContainer,
        {
          borderRadius: radius - 2,
          backgroundColor: "#17102E", // improved surface
          borderColor: "rgba(255,255,255,0.03)",
          borderWidth: 1,
        },
      ]}
      className={className}
    >
      {source ? (
        <>
          <Image
            source={typeof source === "string" ? { uri: source } : source}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: radius - 2,
            }}
            resizeMode="cover"
          />
          {locked && (
            <BlurView
              intensity={Platform.OS === "ios" ? 30 : 20}
              tint="dark"
              style={styles.blurOverlay}
            >
              {/* optional lock icon center could go here */}
            </BlurView>
          )}
        </>
      ) : (
        <View style={[styles.fallback, { borderRadius: radius - 2 }]}>
          <Text
            style={[
              styles.fallbackText,
              { fontSize: Math.round(dimension / 2.6) },
            ]}
          >
            {fallback.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { width: dimension, height: dimension, borderRadius: radius },
        glow && styles.glowEffect,
        style,
      ]}
    >
      {bordered ? (
        <LinearGradient
          colors={["#6D28D9", "#A78BFA"]} // soft brand purple -> light violet
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.borderGradient, { borderRadius: radius }]}
        >
          <InnerContent />
        </LinearGradient>
      ) : (
        <View style={{ flex: 1, borderRadius: radius, overflow: "hidden" }}>
          <InnerContent />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  borderGradient: {
    padding: 2,
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C1433", // improved fallback surface (deep violet)
    width: "100%",
    height: "100%",
  },
  fallbackText: {
    color: "#F5F3FF", // warm white, less harsh than pure #FFF
    fontWeight: "700",
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    // tint already handled by BlurView 'tint' prop
  },
  glowEffect: {
    // softer, wide purple glow for dark backgrounds
    // shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
    // Android: emulate glow with a translucent border (optional)
    borderWidth: Platform.OS === "android" ? 0.6 : 0,
    borderColor: "rgba(124,58,237,0.12)",
  },
});
