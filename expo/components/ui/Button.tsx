import React from "react";
import {
  Pressable,
  PressableProps,
  ActivityIndicator,
  View,
  Animated,
} from "react-native";
import { Typography } from "./Typography";

export interface ButtonProps extends PressableProps {
  /**
   * The visual style of the button.
   * - primary: Solid purple background (default)
   * - secondary: Charcoal surface, subtle
   * - ghost: Transparent background, text only
   * - danger: Red background for destructive actions
   * - outline: Bordered with transparent background
   */
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";

  /**
   * The size of the button.
   * - sm: Compact, smaller text
   * - md: Standard 44px height (default)
   * - lg: Larger, prominent
   */
  size?: "sm" | "md" | "lg";

  /**
   * Whether the button is in a loading state.
   * Replaces text with a spinner.
   */
  loading?: boolean;

  /**
   * Optional icon component to render before the text.
   */
  icon?: React.ReactNode;

  /**
   * Position of the icon relative to the text.
   * - left: Before the text (default)
   * - right: After the text
   */
  iconPosition?: "left" | "right";

  /**
   * The text content of the button.
   */
  children?: React.ReactNode;

  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  children,
  className = "",
  style,
  ...props
}: ButtonProps) {
  // Base container styles
  let containerStyles =
    "flex-row items-center justify-center rounded-full overflow-hidden";

  // Size styles
  switch (size) {
    case "sm":
      containerStyles += " h-9 px-4";
      break;
    case "md":
      containerStyles += " h-12 px-6"; // 48px (approx 44px+ requirement)
      break;
    case "lg":
      containerStyles += " h-14 px-8";
      break;
  }

  // Variant styles (Background & Border)
  switch (variant) {
    case "primary":
      containerStyles += disabled
        ? " bg-surface-elevated opacity-50"
        : " bg-primary active:opacity-90";
      break;
    case "secondary":
      containerStyles += disabled
        ? " bg-surface opacity-50"
        : " bg-surface-elevated active:bg-surface";
      break;
    case "ghost":
      containerStyles += disabled
        ? " opacity-30"
        : " bg-transparent active:bg-surface-elevated/20";
      break;
    case "danger":
      containerStyles += disabled
        ? " bg-surface-elevated opacity-50"
        : " bg-danger active:opacity-90";
      break;
    case "outline":
      containerStyles += disabled
        ? " border border-surface-elevated opacity-50"
        : " border border-primary bg-transparent active:bg-primary/10";
      break;
  }

  // Text Color Logic
  let textColor:
    | "default"
    | "muted"
    | "primary"
    | "accent"
    | "success"
    | "danger"
    | "ai" = "default";
  if (variant === "primary" || variant === "danger") {
    textColor = "default"; // Usually white/light on dark bg
  } else if (variant === "ghost") {
    textColor = "muted";
  } else if (variant === "outline") {
    textColor = "primary";
  } else {
    textColor = "default";
  }

  // Typography Variant
  const textVariant = size === "sm" ? "caption" : "label";

  return (
    <Pressable
      disabled={disabled || loading}
      className={`${containerStyles} ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "ghost" ? "#A6A6B2" : "#E6E6F0"}
        />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <View className="mr-2">{icon}</View>
          )}

          {typeof children === "string" ? (
            <Typography
              variant={textVariant}
              color={textColor}
              className="font-semibold"
            >
              {children}
            </Typography>
          ) : (
            children
          )}

          {icon && iconPosition === "right" && (
            <View className="ml-2">{icon}</View>
          )}
        </>
      )}
    </Pressable>
  );
}
