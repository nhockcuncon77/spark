import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { Typography } from './Typography';

export interface LikertScaleProps extends ViewProps {
  /**
   * The question or statement for the user to evaluate.
   */
  question: string;

  /**
   * The current value (1-5).
   * 1 = Strongly Disagree
   * 5 = Strongly Agree
   * null = No selection yet
   */
  value: number | null;

  /**
   * Callback when a value is selected.
   */
  onChange: (value: number) => void;

  className?: string;
}

export function LikertScale({
  question,
  value,
  onChange,
  className = '',
  style,
  ...props
}: LikertScaleProps) {
  const options = [1, 2, 3, 4, 5];

  return (
    <View className={`w-full py-4 ${className}`} style={style} {...props}>
      <Typography variant="body" className="mb-6 font-medium text-center">
        {question}
      </Typography>

      <View className="flex-row justify-between items-center px-2 mb-3">
        {/* Connecting Line (Visual only) */}
        <View className="absolute left-4 right-4 h-[2px] bg-surface-elevated top-1/2 -translate-y-1/2 -z-10" />

        {options.map((optionValue) => {
          const isSelected = value === optionValue;

          // Dynamic sizing for visual emphasis
          // Middle is standard, edges slightly larger? Or uniform?
          // Let's keep it uniform for clean UI, maybe scale up selected.

          return (
            <Pressable
              key={optionValue}
              onPress={() => onChange(optionValue)}
              className="items-center justify-center w-12 h-12"
              hitSlop={8}
            >
              <View
                className={`
                  w-6 h-6 rounded-full border-2
                  ${isSelected
                    ? 'bg-primary border-primary scale-125'
                    : 'bg-background border-surface-elevated'
                  }
                `}
              />
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row justify-between px-2">
        <Typography variant="caption" color="muted" className="w-20 text-left">
          Strongly Disagree
        </Typography>
        <Typography variant="caption" color="muted" className="w-20 text-right">
          Strongly Agree
        </Typography>
      </View>
    </View>
  );
}
