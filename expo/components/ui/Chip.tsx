import React from 'react';
import { Pressable, View, ViewProps, GestureResponderEvent } from 'react-native';
import { Typography } from './Typography';

export interface ChipProps extends ViewProps {
  label: string;
  /**
   * Visual style of the chip.
   * - default: Neutral surface (unselected hobby/trait)
   * - primary: Purple (selected hobby/trait)
   * - outline: Border only
   * - ai: Special styling for AI suggestions
   */
  variant?: 'default' | 'primary' | 'outline' | 'ai';

  /**
   * Optional icon to display before the label
   */
  icon?: React.ReactNode;

  /**
   * If provided, the chip becomes interactive
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Whether the chip is in a selected state (mostly for filter/selection contexts)
   */
  selected?: boolean;

  className?: string;
}

export function Chip({
  label,
  variant = 'default',
  icon,
  onPress,
  selected = false,
  className = '',
  style,
  ...props
}: ChipProps) {

  const isInteractive = !!onPress;
  const Component = isInteractive ? Pressable : View;

  let containerStyles = "flex-row items-center justify-center rounded-full px-3 py-1.5 self-start border";
  let textColor: 'default' | 'muted' | 'primary' | 'ai' = 'default';

  // Base styles per variant
  switch (variant) {
    case 'default':
      containerStyles += selected
        ? " bg-primary border-primary"
        : " bg-surface-elevated border-surface-elevated";
      textColor = selected ? 'default' : 'muted';
      break;

    case 'primary':
      containerStyles += " bg-primary border-primary";
      textColor = 'default';
      break;

    case 'outline':
      containerStyles += selected
        ? " bg-primary/20 border-primary"
        : " bg-transparent border-muted/30";
      textColor = selected ? 'primary' : 'muted';
      break;

    case 'ai':
      containerStyles += " bg-ai/10 border-ai/50";
      textColor = 'ai';
      break;
  }

  // Interactive feedback
  if (isInteractive) {
    containerStyles += " active:opacity-80";
  }

  return (
    <Component
      className={`${containerStyles} ${className}`}
      style={style}
      onPress={onPress}
      {...props as any}
    >
      {icon && <View className="mr-1.5">{icon}</View>}
      <Typography
        variant="caption"
        color={textColor}
        className="font-medium"
      >
        {label}
      </Typography>
    </Component>
  );
}
