// StreakBadge Component
// Displays streak count with fire emoji and visual indicators for at-risk streaks

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Flame, AlertTriangle, Timer } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";

interface StreakBadgeProps {
  count: number;
  isAtRisk?: boolean;
  hoursRemaining?: number | null;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  onPress?: () => void;
}

const SIZES = {
  small: {
    container: 24,
    icon: 12,
    text: 10,
    padding: 4,
  },
  medium: {
    container: 32,
    icon: 16,
    text: 12,
    padding: 6,
  },
  large: {
    container: 44,
    icon: 20,
    text: 14,
    padding: 8,
  },
};

const MILESTONE_COLORS = {
  7: "#F59E0B", // Amber - Week
  14: "#EF4444", // Red - Two weeks
  30: "#EC4899", // Pink - Month
  50: "#8B5CF6", // Purple - 50 days
  100: "#6366F1", // Indigo - 100 days
  365: "#FFD700", // Gold - Year
};

function getStreakColor(count: number): string {
  if (count >= 365) return MILESTONE_COLORS[365];
  if (count >= 100) return MILESTONE_COLORS[100];
  if (count >= 50) return MILESTONE_COLORS[50];
  if (count >= 30) return MILESTONE_COLORS[30];
  if (count >= 14) return MILESTONE_COLORS[14];
  if (count >= 7) return MILESTONE_COLORS[7];
  return "#F97316"; // Default orange
}

function getStreakEmoji(count: number): string {
  if (count >= 365) return "👑";
  if (count >= 100) return "💯";
  if (count >= 50) return "⭐";
  if (count >= 30) return "🔥🔥🔥";
  if (count >= 14) return "🔥🔥";
  if (count >= 7) return "🔥";
  return "";
}

export function StreakBadge({
  count,
  isAtRisk = false,
  hoursRemaining,
  size = "medium",
  showLabel = false,
  onPress,
}: StreakBadgeProps) {
  const sizeConfig = SIZES[size];
  const streakColor = getStreakColor(count);

  // Pulse animation for at-risk streaks
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (isAtRisk) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [isAtRisk]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (count === 0) {
    return null;
  }

  const Container = onPress ? Pressable : View;

  return (
    <Container onPress={onPress}>
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          {
            minWidth: sizeConfig.container,
            height: sizeConfig.container,
            paddingHorizontal: sizeConfig.padding,
            backgroundColor: isAtRisk ? "rgba(239, 68, 68, 0.2)" : "rgba(249, 115, 22, 0.2)",
            borderColor: isAtRisk ? "#EF4444" : streakColor,
          },
        ]}
      >
        {isAtRisk ? (
          <AlertTriangle
            size={sizeConfig.icon}
            color="#EF4444"
            style={styles.icon}
          />
        ) : (
          <Flame
            size={sizeConfig.icon}
            color={streakColor}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.count,
            {
              fontSize: sizeConfig.text,
              color: isAtRisk ? "#EF4444" : streakColor,
            },
          ]}
        >
          {count}
        </Text>
      </Animated.View>

      {showLabel && (
        <View style={styles.labelContainer}>
          {isAtRisk && hoursRemaining ? (
            <View style={styles.atRiskLabel}>
              <Timer size={10} color="#EF4444" />
              <Text style={styles.atRiskText}>{hoursRemaining}h left</Text>
            </View>
          ) : (
            <Text style={[styles.label, { color: streakColor }]}>
              {count} day streak {getStreakEmoji(count)}
            </Text>
          )}
        </View>
      )}
    </Container>
  );
}

// Streak info card for profile or chat header
interface StreakInfoCardProps {
  count: number;
  longestStreak: number;
  isAtRisk?: boolean;
  hoursRemaining?: number | null;
  matchName?: string;
}

export function StreakInfoCard({
  count,
  longestStreak,
  isAtRisk = false,
  hoursRemaining,
  matchName,
}: StreakInfoCardProps) {
  const streakColor = getStreakColor(count);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Flame size={20} color={streakColor} />
          <Text style={styles.cardTitle}>
            {count} Day Streak {getStreakEmoji(count)}
          </Text>
        </View>
        {matchName && (
          <Text style={styles.cardSubtitle}>with {matchName}</Text>
        )}
      </View>

      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{count}</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
      </View>

      {isAtRisk && hoursRemaining && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={16} color="#EF4444" />
          <Text style={styles.warningText}>
            Send a message within {hoursRemaining} hours to keep your streak!
          </Text>
        </View>
      )}

      <View style={styles.milestonesContainer}>
        <Text style={styles.milestonesTitle}>Milestones</Text>
        <View style={styles.milestones}>
          {[7, 14, 30, 50, 100].map((milestone) => (
            <View
              key={milestone}
              style={[
                styles.milestone,
                count >= milestone && styles.milestoneAchieved,
                { borderColor: count >= milestone ? MILESTONE_COLORS[milestone as keyof typeof MILESTONE_COLORS] : "rgba(255,255,255,0.2)" },
              ]}
            >
              <Text
                style={[
                  styles.milestoneText,
                  count >= milestone && { color: MILESTONE_COLORS[milestone as keyof typeof MILESTONE_COLORS] },
                ]}
              >
                {milestone}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// Mini streak indicator for chat list items
interface MiniStreakProps {
  count: number;
  isAtRisk?: boolean;
}

export function MiniStreak({ count, isAtRisk = false }: MiniStreakProps) {
  if (count === 0) return null;

  return (
    <View
      style={[
        styles.miniContainer,
        isAtRisk && styles.miniContainerAtRisk,
      ]}
    >
      <Flame
        size={10}
        color={isAtRisk ? "#EF4444" : "#F97316"}
      />
      <Text
        style={[
          styles.miniCount,
          isAtRisk && styles.miniCountAtRisk,
        ]}
      >
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    gap: 2,
  },
  icon: {
    marginRight: 1,
  },
  count: {
    fontWeight: "700",
  },
  labelContainer: {
    marginTop: 4,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
  },
  atRiskLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  atRiskText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "600",
  },

  // Card styles
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
    marginLeft: 28,
  },
  cardStats: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "500",
  },
  milestonesContainer: {
    marginTop: 8,
  },
  milestonesTitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 8,
  },
  milestones: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  milestone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneAchieved: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.4)",
  },

  // Mini streak styles
  miniContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  miniContainerAtRisk: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  miniCount: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F97316",
  },
  miniCountAtRisk: {
    color: "#EF4444",
  },
});
