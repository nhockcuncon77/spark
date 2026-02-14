import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  /**
   * The visual style of the card.
   * - default: Charcoal surface (#121218)
   * - elevated: Slightly lighter surface (#16161B)
   * - outlined: Transparent with border
   */
  variant?: 'default' | 'elevated' | 'outlined';

  /**
   * Internal padding of the card.
   * - none: 0
   * - sm: 12px
   * - md: 16px (default)
   * - lg: 24px
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  className?: string;
}

export function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  style,
  ...props
}: CardProps) {

  let styles = "rounded-2xl overflow-hidden";

  // Variant styles
  switch (variant) {
    case 'default':
      styles += " bg-surface";
      break;
    case 'elevated':
      styles += " bg-surface-elevated";
      break;
    case 'outlined':
      styles += " bg-transparent border border-surface-elevated";
      break;
  }

  // Padding styles
  switch (padding) {
    case 'none':
      styles += " p-0";
      break;
    case 'sm':
      styles += " p-3";
      break;
    case 'md':
      styles += " p-4";
      break;
    case 'lg':
      styles += " p-6";
      break;
  }

  return (
    <View
      className={`${styles} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
