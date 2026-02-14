import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  useLocalSearchParams,
  router,
  useRootNavigationState,
} from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { GradientBackground } from "../../components/ui/GradientBackground";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  ChevronLeft,
  Send,
  Lock,
  Unlock,
  MoreVertical,
} from "lucide-react-native";
import {
  chatService,
  ChatWebSocket,
  Message,
  Connection,
} from "../../services/chat-service";
import { getCurrentUserId } from "../../utils/jwt";
import * as ChatDB from "../../services/chat-db";
import { AIReplyButton, AIReplyModal, useAIReplies } from "../../components/chat/AIReplyButton";
import { MiniStreak } from "../../components/ui/StreakBadge";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";

const getDayLabel = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const PulsingDot = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className="w-1.5 h-1.5 rounded-full bg-[#6A1BFF]"
      style={animatedStyle}
    />
  );
};

export default function ChatDetailScreen() {
  // Check if navigation is ready to prevent "Couldn't find navigation context" error
  const rootNavigationState = useRootNavigationState();
  const navigationReady = rootNavigationState?.key != null;

  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<ChatWebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [inputText, setInputText] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [hasShownRating, setHasShownRating] = useState(false);
  const wasUnlockedRef = useRef(false);

  // AI Reply modal hook
  const { isModalVisible, openModal, closeModal, canUse: canUseAI, remaining: aiRemaining } = useAIReplies(chatId || "");

  // Subscription state for AI replies
  const { canUseAIReplies, aiRepliesRemaining } = useSubscriptionStore();

  // Initialize user ID
  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId);
  }, []);

  // Fetch connection data
  useEffect(() => {
    const fetchConnection = async () => {
      const result = await chatService.getMyConnections();
      if (result.success && result.connections) {
        const conn = result.connections.find((c) => c.chat.id === chatId);
        if (conn) {
          // Check if this is newly unlocked (was not unlocked before, now is)
          if (conn.match.is_unlocked && !wasUnlockedRef.current && !hasShownRating) {
            // Check if user hasn't rated yet - show rating modal
            const postRating = conn.match.post_unlock_rating;
            if (postRating.she_rating === 0 || postRating.he_rating === 0) {
              // Navigate to rating screen
              router.push(`/modal/rating?chatId=${chatId}` as any);
              setHasShownRating(true);
            }
          }
          wasUnlockedRef.current = conn.match.is_unlocked;
          setConnection(conn);
        }
      }
    };
    fetchConnection();
  }, [chatId, hasShownRating]);

  // Load cached messages
  useEffect(() => {
    if (!chatId || Platform.OS === "web") return;

    ChatDB.getMessages(chatId, 50).then((cached) => {
      if (cached.length > 0) setMessages(cached);
    });
  }, [chatId]);

  const isValidMessage = useCallback((message: Message): boolean => {
    return (
      (message.content && message.content.trim().length > 0) ||
      (message.media && message.media.length > 0)
    );
  }, []);

  const sendSeenEvent = useCallback(
    (msgs: Message[], userId: string) => {
      if (!wsRef.current || !isConnected) return;

      const unseenFromOther = msgs
        .filter(
          (m) => !m.id.startsWith("temp-") && m.sender_id !== userId && !m.seen,
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

      if (unseenFromOther.length > 0) {
        wsRef.current.markMessagesSeen([unseenFromOther[0].id]);

        setMessages((prev) =>
          prev.map((m) => {
            const shouldMark = unseenFromOther.some(
              (u) =>
                new Date(m.created_at).getTime() <=
                new Date(u.created_at).getTime() && m.sender_id !== userId,
            );
            return shouldMark ? { ...m, seen: true } : m;
          }),
        );

        if (chatId && Platform.OS !== "web") {
          ChatDB.markAllSeenBefore(chatId, unseenFromOther[0].id);
        }
      }
    },
    [chatId, isConnected],
  );

  // WebSocket connection
  useEffect(() => {
    if (!chatId) return;

    const ws = new ChatWebSocket(chatId);
    wsRef.current = ws;

    ws.onConnected = () => {
      setIsConnecting(false);
      setIsConnected(true);
      ws.queryMessages(50);
    };

    ws.onDisconnected = () => setIsConnected(false);

    ws.onMessage = (message: Message) => {
      setMessages((prev) => {
        const existingIndex = prev.findIndex((m) => m.id === message.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = message;
          return updated;
        }

        if (!isValidMessage(message)) return prev;

        const tempIndex = prev.findIndex(
          (m) =>
            m.id.startsWith("temp-") &&
            m.content === message.content &&
            m.sender_id === message.sender_id,
        );

        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = message;
          if (chatId && Platform.OS !== "web")
            ChatDB.saveMessage(chatId, message);
          return updated;
        }

        if (chatId && Platform.OS !== "web")
          ChatDB.saveMessage(chatId, message);
        return [...prev, message];
      });
    };

    ws.onMessagesLoaded = (loadedMessages: Message[]) => {
      const validMessages = loadedMessages.filter(isValidMessage);
      const uniqueMessages = new Map<string, Message>();
      validMessages.forEach((msg) => uniqueMessages.set(msg.id, msg));

      const sortedMessages = Array.from(uniqueMessages.values()).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      setMessages((prev) => {
        const merged = new Map<string, Message>();
        prev.forEach((msg) => {
          if (!msg.id.startsWith("temp-")) merged.set(msg.id, msg);
        });
        sortedMessages.forEach((msg) => merged.set(msg.id, msg));
        return Array.from(merged.values()).sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      });

      if (chatId && Platform.OS !== "web" && sortedMessages.length > 0) {
        ChatDB.saveMessages(chatId, sortedMessages);
      }
      setHasMoreMessages(sortedMessages.length >= 50);
    };

    ws.onTypingStarted = () => setOtherUserTyping(true);
    ws.onTypingStopped = () => setOtherUserTyping(false);
    ws.onError = () => setIsConnecting(false);

    ws.connect();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      ws.disconnect();
    };
  }, [chatId, isValidMessage]);

  // Send seen events
  useEffect(() => {
    if (isConnected && currentUserId && messages.length > 0) {
      sendSeenEvent(messages, currentUserId);
    }
  }, [isConnected, currentUserId, messages, sendSeenEvent]);

  const handleBack = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && wsRef.current) wsRef.current.stopTyping();
    try {
      router.back();
    } catch (e) {
      // Fallback if navigation context isn't ready
      console.warn("Navigation context not ready:", e);
    }
  }, []);

  const handleMenu = useCallback(() => {
    Alert.alert("Options", undefined, [
      {
        text: "Report User",
        onPress: () => Alert.alert("Reported", "User has been reported."),
      },
      {
        text: "Block User",
        style: "destructive",
        onPress: () => Alert.alert("Blocked", "User has been blocked."),
      },
      {
        text: "Delete Chat",
        style: "destructive",
        onPress: () => Alert.alert("Deleted", "Chat has been deleted."),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (text && !isTypingRef.current) {
      isTypingRef.current = true;
      wsRef.current?.startTyping();
    }

    if (!text && isTypingRef.current) {
      isTypingRef.current = false;
      wsRef.current?.stopTyping();
      return;
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        wsRef.current?.stopTyping();
      }
    }, 2000);
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !wsRef.current || !isConnected || !currentUserId)
      return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      wsRef.current.stopTyping();
    }

    const createdAt = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      type: "TEXT",
      content: inputText.trim(),
      sender_id: currentUserId,
      received: false,
      seen: false,
      media: [],
      reactions: [],
      created_at: createdAt,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setShowAiSuggestions(false);

    wsRef.current.sendMessage({
      type: "TEXT",
      content: newMessage.content,
      created_at: createdAt,
    });
  }, [inputText, isConnected, currentUserId]);

  const handleLoadMore = useCallback(async () => {
    if (
      isLoadingMore ||
      !hasMoreMessages ||
      !wsRef.current ||
      messages.length === 0
    )
      return;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];

    if (Platform.OS !== "web" && chatId) {
      const olderCached = await ChatDB.getMessages(
        chatId,
        50,
        oldestMessage.id,
      );
      if (olderCached.length > 0) {
        setMessages((prev) => [...olderCached, ...prev]);
        setIsLoadingMore(false);
        setHasMoreMessages(olderCached.length >= 50);
        return;
      }
    }

    wsRef.current.queryMessages(50, oldestMessage.id);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMoreMessages, messages, chatId]);

  // Handle AI reply selection
  const handleSelectAIReply = useCallback((reply: string) => {
    setInputText(reply);
  }, []);

  const newestSeenIndex = React.useMemo(() => {
    return messages
      .slice()
      .reverse()
      .findIndex((m) => m.seen && m.sender_id === currentUserId);
  }, [messages, currentUserId]);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      if (!connection) return null;

      const isMe = item.sender_id === currentUserId;
      const messagesReversed = [...messages].reverse();
      const nextItem = messagesReversed[index + 1];
      const showDate =
        !nextItem ||
        getDayLabel(item.created_at) !== getDayLabel(nextItem.created_at);
      const isSeenVisual =
        item.seen ||
        (isMe && newestSeenIndex !== -1 && index >= newestSeenIndex);
      const isUnlocked = connection.match.is_unlocked;

      return (
        <View className="px-4">
          {showDate && (
            <View className="items-center py-4 opacity-60">
              <View className="bg-black/30 px-3 py-1 rounded-full border border-white/5">
                <Typography
                  variant="caption"
                  className="text-white font-medium text-xs"
                >
                  {getDayLabel(item.created_at)}
                </Typography>
              </View>
            </View>
          )}

          <Animated.View
            entering={FadeInDown.duration(400).delay(index * 50)}
            className={`mb-3 flex-row ${isMe ? "justify-end" : "justify-start"}`}
          >
            {!isMe && (
              <Avatar
                source={connection.connection_profile.pfp}
                fallback={connection.connection_profile.name}
                locked={!isUnlocked}
                size="sm"
                bordered={false}
              />
            )}
            <View
              className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} mx-2`}
            >
              <View
                className={`px-4 py-3 ${"" /*shadow-md*/} ${isMe
                  ? "bg-[#6A1BFF] rounded-2xl rounded-tr-sm border border-[#9B6BFF]"
                  : "bg-[#1D0F45]/90 rounded-2xl rounded-tl-sm border border-white/10"
                  }`}
                style={
                  isMe
                    ? {
                      // shadowColor: "#6A1BFF",
                      shadowOpacity: 0.25,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                    }
                    : {}
                }
              >
                <Typography variant="body" className={`text-base text-white`}>
                  {item.content}
                </Typography>
              </View>
              <View className="flex-row items-center mt-1 gap-1 px-1">
                <Typography
                  variant="caption"
                  className="text-white/40 text-[10px] font-medium"
                >
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
                {isMe && isSeenVisual && (
                  <Typography
                    variant="caption"
                    className="text-[#14D679] text-[10px] font-bold tracking-tighter"
                  >
                    ✓✓
                  </Typography>
                )}
                {isMe && !isSeenVisual && item.received && (
                  <Typography
                    variant="caption"
                    className="text-white/40 text-[10px]"
                  >
                    ✓
                  </Typography>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      );
    },
    [connection, currentUserId, messages, newestSeenIndex],
  );

  // Don't render until navigation is ready
  if (!navigationReady) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6A1BFF" />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!connection && isConnecting) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6A1BFF" />
          <Typography variant="body" className="mt-4 text-white/70">
            Connecting...
          </Typography>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!connection) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Typography variant="h2" className="text-white">
            Chat not found
          </Typography>
          <Button variant="primary" onPress={handleBack} className="mt-4">
            Go Back
          </Button>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const profile = connection.connection_profile;
  const isUnlocked = connection.match.is_unlocked;
  const progressPercent = connection.percentage_complete;

  return (
    <GradientBackground>
      <View className="absolute inset-0 items-center justify-center opacity-20 pointer-events-none">
        <Image
          source={require("../../assets/main-trans.png")}
          className="w-[80vw] h-[80vw]"
          resizeMode="contain"
          style={{ tintColor: "#fff" }}
        />
      </View>

      <SafeAreaView className="flex-1" edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View className="flex-row items-center px-4 py-3 border-b border-white/5 bg-white/5 backdrop-blur-lg z-10">
            <Pressable
              onPress={handleBack}
              className="mr-4 p-2 rounded-full bg-white/10 active:bg-white/20"
            >
              <ChevronLeft size={24} color="#FFF" />
            </Pressable>

            <Pressable className="flex-row items-center flex-1">
              <Avatar
                source={profile.pfp}
                fallback={profile.name}
                locked={!isUnlocked}
                className="margin-2"
                size="md"
                glow
                bordered={false}
              />
              <View className="flex-1 mx-4">
                <View className="flex-row items-center gap-2">
                  <Typography
                    variant="h3"
                    className="text-white text-xl font-bold tracking-tight my-0.5"
                  >
                    {profile.name}
                  </Typography>
                  {profile.is_online && (
                    <View
                      className={`w-2.5 h-2.5 rounded-full bg-[#14D679] ${"" /*shadow-[0_0_8px_#14D679]*/}`}
                    />
                  )}
                  {/* Streak Badge - shows if streak exists */}
                  {connection.match.streak_count > 0 && (
                    <MiniStreak
                      count={connection.match.streak_count}
                      isAtRisk={connection.match.streak_at_risk}
                    />
                  )}
                </View>
                <View className="flex-row items-center mt-0.5">
                  {isUnlocked ? (
                    <View className="flex-row items-center">
                      <Unlock size={10} color="#14D679" />
                      <Typography
                        variant="caption"
                        className="ml-1 text-[#14D679] font-medium"
                      >
                        Photos Unlocked
                      </Typography>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Lock size={10} color="#A6A6B2" />
                      <Typography
                        variant="caption"
                        className="ml-1 text-white/50"
                      >
                        {progressPercent}% to unlock!
                      </Typography>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={handleMenu}
              className="p-2 rounded-full active:bg-white/10"
            >
              <MoreVertical size={24} color="#FFF" />
            </Pressable>
          </View>

          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
            inverted
            ListHeaderComponent={
              otherUserTyping ? (
                <View className="px-4 py-2">
                  <View className="bg-[#1D0F45]/80 rounded-2xl rounded-tl-none px-4 py-3 self-start border border-white/10">
                    <View className="flex-row gap-1">
                      <PulsingDot delay={0} />
                      <PulsingDot delay={200} />
                      <PulsingDot delay={400} />
                    </View>
                  </View>
                </View>
              ) : null
            }
            removeClippedSubviews={Platform.OS !== "web"}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={10}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator
                  size="small"
                  color="#6A1BFF"
                  className="py-4"
                />
              ) : null
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-16 opacity-50 transform scale-y-[-1]">
                <Typography
                  variant="body"
                  className="text-white text-lg font-medium"
                >
                  Say hello! 👋
                </Typography>
              </View>
            }
          />

          <View className="px-4 py-3 border-t border-white/5 bg-black/40 backdrop-blur-xl pb-6">
            <View className="flex-row items-center gap-3">
              <AIReplyButton
                onPress={openModal}
                disabled={!canUseAI}
                remaining={aiRepliesRemaining === -1 ? undefined : aiRepliesRemaining}
              />

              <View className="flex-1 flex-row items-center bg-white/5 rounded-3xl px-5 py-2 border border-white/10 focus:border-[#6A1BFF]/50 shadow-inner">
                <TextInput
                  value={inputText}
                  onChangeText={handleInputChange}
                  placeholder="Type a pickup line..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="flex-1 text-white text-base py-1 leading-5 font-sans"
                  style={{ maxHeight: 100 }}
                  multiline
                  maxLength={500}
                />
              </View>

              <Pressable
                onPress={handleSend}
                disabled={!inputText.trim() || !isConnected}
                className={`w-11 h-11 rounded-full items-center justify-center ${inputText.trim() && isConnected
                  ? "bg-[#6A1BFF]"
                  : // ? "bg-[#6A1BFF] shadow-[0_0_15px_#6A1BFF]"
                  "bg-white/5"
                  }`}
              >
                <Send
                  size={20}
                  color={
                    inputText.trim() && isConnected
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.2)"
                  }
                  style={{ marginLeft: 2 }}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* AI Reply Modal */}
      <AIReplyModal
        visible={isModalVisible}
        onClose={closeModal}
        onSelectReply={handleSelectAIReply}
        chatId={chatId || ""}
      />
    </GradientBackground>
  );
}
