import React from 'react';
import { View, ViewProps } from 'react-native';
import { Typography } from './Typography';

export interface BadgeProps extends ViewProps {
  label: string | number;
  /**
   * Visual style of the badge.
   * - default: Neutral surface
   * - primary: Purple
   * - success: Green
   * - danger: Red
   * - ai: Yellow (AI features)
   */
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'ai';

  /**
   * Size of the badge.
   * - sm: Small, tight padding (good for counts)
   * - md: Standard (default)
   */
  size?: 'sm' | 'md';

  /**
   * Optional icon to display before the label
   */
  icon?: React.ReactNode;

  className?: string;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  style,
  ...props
}: BadgeProps) {

  let containerStyles = "flex-row items-center justify-center rounded-full self-start overflow-hidden";
  let textColor: 'default' | 'muted' | 'primary' | 'success' | 'danger' | 'ai' = 'default';

  // Size styles
  switch (size) {
    case 'sm':
      containerStyles += " px-1.5 py-0.5 min-w-[20px]";
      break;
    case 'md':
      containerStyles += " px-2.5 py-1";
      break;
  }

  // Variant styles
  switch (variant) {
    case 'default':
      containerStyles += " bg-surface-elevated";
      textColor = 'muted';
      break;
    case 'primary':
      containerStyles += " bg-primary";
      textColor = 'default'; // White on purple
      break;
    case 'success':
      containerStyles += " bg-success/20 border border-success/50";
      textColor = 'success';
      break;
    case 'danger':
      containerStyles += " bg-danger";
      textColor = 'default'; // White on red
      break;
    case 'ai':
      containerStyles += " bg-ai/20 border border-ai/50";
      textColor = 'ai';
      break;
  }

  return (
    <View
      className={`${containerStyles} ${className}`}
      style={style}
      {...props}
    >
      {icon && <View className="mr-1">{icon}</View>}
      <Typography
        variant="caption"
        color={textColor}
        className="font-bold text-[10px] uppercase tracking-wider leading-none"
      >
        {label}
      </Typography>
    </View>
  );
}
