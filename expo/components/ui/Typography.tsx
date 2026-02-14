import React from 'react';
import { Text, TextProps } from 'react-native';

export interface TypographyProps extends TextProps {
  /**
   * The typographic style to apply.
   * - h1: 28px, Bold
   * - h2: 24px, Semibold
   * - h3: 20px, Semibold
   * - body: 16px, Normal (default)
   * - label: 14px, Medium
   * - caption: 12px, Normal
   */
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption';

  /**
   * The color theme to apply.
   * - default: #E6E6F0 (Body text)
   * - muted: #A6A6B2
   * - primary: #7C3AED
   * - accent: #8B5CF6
   * - success: #16A34A
   * - danger: #EF4444
   * - ai: #FFD166
   */
  color?: 'default' | 'muted' | 'primary' | 'accent' | 'success' | 'danger' | 'ai';

  className?: string;
}

export function Typography({
  variant = 'body',
  color = 'default',
  className = '',
  style,
  children,
  ...props
}: TypographyProps) {

  let styles = "font-sans"; // Base Lexend-Regular

  // Variant styles - using Lexend font family
  switch (variant) {
    case 'h1':
      styles = "font-lexend-bold text-[28px] leading-tight";
      break;
    case 'h2':
      styles = "font-lexend-semibold text-[24px] leading-snug";
      break;
    case 'h3':
      styles = "font-lexend-semibold text-[20px] leading-snug";
      break;
    case 'body':
      styles = "font-lexend-regular text-[16px] leading-relaxed";
      break;
    case 'label':
      styles = "font-lexend-medium text-[14px] leading-none";
      break;
    case 'caption':
      styles = "font-lexend-regular text-[12px] leading-tight";
      break;
  }

  // Color styles
  switch (color) {
    case 'default':
      styles += " text-body";
      break;
    case 'muted':
      styles += " text-muted";
      break;
    case 'primary':
      styles += " text-primary";
      break;
    case 'accent':
      styles += " text-accent";
      break;
    case 'success':
      styles += " text-success";
      break;
    case 'danger':
      styles += " text-danger";
      break;
    case 'ai':
      styles += " text-ai";
      break;
  }

  return (
    <Text
      className={`${styles} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}
