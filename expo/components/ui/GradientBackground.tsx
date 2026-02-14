import React from "react";
import { ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GradientBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  style,
  ...props
}) => {
  return (
    <LinearGradient
      colors={["#080314", "#120A24", "#1A1033"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};
