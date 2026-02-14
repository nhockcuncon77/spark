import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Typography } from "../ui/Typography";
import { LucideMessageCircleWarning } from "lucide-react-native";

interface CompletionMeterProps {
  percent: number;
  onPress?: () => void;
}

export const CompletionMeter: React.FC<CompletionMeterProps> = ({
  percent,
  onPress,
}) => {
  const clampedPercent = Math.min(100, Math.max(0, Math.round(percent)));

  const getColor = () => {
    if (clampedPercent >= 80) return "#14D679";
    if (clampedPercent >= 50) return "#7C3AED";
    return "#FFD166";
  };

  const getMessage = () => {
    if (clampedPercent >= 100) return "Profile complete!";
    if (clampedPercent >= 80) return "Almost there!";
    if (clampedPercent >= 50) return "Looking good";
    return "Complete your profile";
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textRow}>
          <View>
            <Typography
              variant="body"
              className="text-white font-semibold mb-1"
            >
              {getMessage()}
            </Typography>
            <Typography variant="caption" className="text-white/50">
              {clampedPercent}% complete
            </Typography>
          </View>
          {clampedPercent < 100 && (
            <LucideMessageCircleWarning
              size={20}
              color="rgba(255,255,255,0.4)"
            />
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${clampedPercent}%`,
                backgroundColor: getColor(),
              },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  content: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  textRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
