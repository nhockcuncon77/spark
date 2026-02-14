import React, { useState } from 'react';
import { TextInput, View, TextInputProps } from 'react-native';
import { Typography } from './Typography';

export interface InputProps extends TextInputProps {
  /**
   * Label text displayed above the input.
   */
  label?: string;

  /**
   * Error message displayed below the input.
   * If present, changes the input border color to danger.
   */
  error?: string;

  /**
   * Helper text displayed below the input (if no error).
   */
  helperText?: string;

  /**
   * Icon to display on the left side of the input.
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display on the right side of the input.
   */
  rightIcon?: React.ReactNode;

  /**
   * Additional classes for the outer container (wrapping label, input, and helper).
   */
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  onFocus,
  onBlur,
  editable = true,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Input Container Styles
  let inputContainerStyles = "flex-row items-center bg-surface-elevated rounded-xl border px-4 h-14";

  if (error) {
    inputContainerStyles += " border-danger";
  } else if (isFocused) {
    inputContainerStyles += " border-primary";
  } else {
    inputContainerStyles += " border-transparent"; // or border-white/5 for subtle definition
  }

  if (!editable) {
    inputContainerStyles += " opacity-50";
  }

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Typography variant="label" color="muted" className="mb-2 ml-1">
          {label}
        </Typography>
      )}

      <View className={inputContainerStyles}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          className={`flex-1 text-body font-inter text-[16px] h-full ${className}`}
          placeholderTextColor="#A6A6B2"
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          style={style}
          {...props}
        />

        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>

      {(error || helperText) && (
        <View className="mt-1.5 ml-1">
          {error ? (
            <Typography variant="caption" color="danger">
              {error}
            </Typography>
          ) : (
            <Typography variant="caption" color="muted">
              {helperText}
            </Typography>
          )}
        </View>
      )}
    </View>
  );
}
