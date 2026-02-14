// AIReplyButton and AIReplyModal Components
// Provides AI-powered reply suggestions in chat

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  Sparkles,
  X,
  RefreshCw,
  Zap,
  Heart,
  Brain,
  Smile,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { aiRepliesService, AIReply } from "@/services/subscription-service";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

// Tone icons mapping
const TONE_ICONS: Record<string, React.ComponentType<any>> = {
  flirty: Heart,
  friendly: Smile,
  witty: Zap,
  thoughtful: Brain,
};

const TONE_COLORS: Record<string, string> = {
  flirty: "#EC4899",
  friendly: "#22C55E",
  witty: "#F59E0B",
  thoughtful: "#6366F1",
};

interface AIReplyButtonProps {
  onPress: () => void;
  disabled?: boolean;
  remaining?: number;
}

export function AIReplyButton({ onPress, disabled = false, remaining }: AIReplyButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Sparkles size={20} color={disabled ? "rgba(255,255,255,0.3)" : "#FFD166"} />
      {remaining !== undefined && remaining >= 0 && (
        <View style={styles.remainingBadge}>
          <Text style={styles.remainingText}>{remaining}</Text>
        </View>
      )}
    </Pressable>
  );
}

interface AIReplyModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectReply: (reply: string) => void;
  chatId: string;
}

export function AIReplyModal({
  visible,
  onClose,
  onSelectReply,
  chatId,
}: AIReplyModalProps) {
  const [replies, setReplies] = useState<AIReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);

  const { canUseAIReplies, decrementAIReplies, aiRepliesRemaining } = useSubscriptionStore();

  const generateReplies = useCallback(async () => {
    if (!canUseAIReplies()) {
      setError("You've reached your daily AI reply limit. Upgrade for more!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiRepliesService.generateReplies(chatId);
      setReplies(result.replies);
      setRemainingToday(result.remaining_today);
      decrementAIReplies();
    } catch (err: any) {
      console.error("[AIReplyModal] Generate error:", err);
      setError(err.message || "Failed to generate replies. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [chatId, canUseAIReplies, decrementAIReplies]);

  // Generate on first open
  React.useEffect(() => {
    if (visible && replies.length === 0 && !isLoading) {
      generateReplies();
    }
  }, [visible]);

  const handleSelectReply = (reply: AIReply) => {
    onSelectReply(reply.text);
    onClose();
  };

  const handleRegenerate = () => {
    setReplies([]);
    generateReplies();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayPressable} onPress={onClose} />

        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown.duration(200)}
          style={styles.modalContainer}
        >
          <BlurView intensity={80} tint="dark" style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                <Sparkles size={20} color="#FFD166" />
                <Text style={styles.title}>AI Suggestions</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            {/* Remaining count */}
            {remainingToday !== null && (
              <View style={styles.remainingContainer}>
                <Text style={styles.remainingLabel}>
                  {remainingToday === -1
                    ? "Unlimited suggestions"
                    : `${remainingToday} suggestions remaining today`}
                </Text>
              </View>
            )}

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFD166" />
                  <Text style={styles.loadingText}>
                    Crafting the perfect replies...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  {canUseAIReplies() && (
                    <Pressable onPress={handleRegenerate} style={styles.retryButton}>
                      <RefreshCw size={16} color="#fff" />
                      <Text style={styles.retryText}>Try Again</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <>
                  {replies.map((reply, index) => {
                    const ToneIcon = TONE_ICONS[reply.tone] || Sparkles;
                    const toneColor = TONE_COLORS[reply.tone] || "#FFD166";

                    return (
                      <Pressable
                        key={reply.id || index}
                        onPress={() => handleSelectReply(reply)}
                        style={({ pressed }) => [
                          styles.replyCard,
                          pressed && styles.replyCardPressed,
                        ]}
                      >
                        <View style={styles.replyHeader}>
                          <View
                            style={[
                              styles.toneBadge,
                              { backgroundColor: `${toneColor}20` },
                            ]}
                          >
                            <ToneIcon size={12} color={toneColor} />
                            <Text style={[styles.toneText, { color: toneColor }]}>
                              {reply.tone}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.replyText}>{reply.text}</Text>
                      </Pressable>
                    );
                  })}

                  {replies.length > 0 && canUseAIReplies() && (
                    <Pressable
                      onPress={handleRegenerate}
                      style={styles.regenerateButton}
                    >
                      <RefreshCw size={16} color="#FFD166" />
                      <Text style={styles.regenerateText}>
                        Generate New Suggestions
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </ScrollView>

            {/* Upgrade prompt for free users */}
            {aiRepliesRemaining === 0 && (
              <View style={styles.upgradePrompt}>
                <Text style={styles.upgradeText}>
                  Want unlimited AI suggestions?
                </Text>
                <Pressable style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                </Pressable>
              </View>
            )}
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Combined hook for easy integration
export function useAIReplies(chatId: string) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { canUseAIReplies, aiRepliesRemaining } = useSubscriptionStore();

  const openModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  return {
    isModalVisible,
    openModal,
    closeModal,
    canUse: canUseAIReplies(),
    remaining: aiRepliesRemaining,
  };
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 209, 102, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  buttonPressed: {
    backgroundColor: "rgba(255, 209, 102, 0.25)",
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  remainingBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFD166",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  remainingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  overlayPressable: {
    flex: 1,
  },
  modalContainer: {
    maxHeight: "70%",
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    paddingBottom: 34, // Safe area
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  remainingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 209, 102, 0.1)",
  },
  remainingLabel: {
    fontSize: 12,
    color: "#FFD166",
    textAlign: "center",
  },
  content: {
    maxHeight: 400,
  },
  contentContainer: {
    padding: 20,
    gap: 12,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  replyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  replyCardPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: [{ scale: 0.98 }],
  },
  replyHeader: {
    marginBottom: 8,
  },
  toneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toneText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  replyText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  regenerateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFD166",
  },
  upgradePrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  upgradeText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
  upgradeButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
});
