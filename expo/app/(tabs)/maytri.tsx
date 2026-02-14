import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StatusBar,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useAIStore } from "../../store/useAIStore";
import {
  Send,
  Sparkles,
  Info,
  History,
  Plus,
  RefreshCw,
  AlertCircle,
  MessageCircle,
} from "lucide-react-native";
import { GradientBackground } from "../../components/ui/GradientBackground";

interface DisplayMessage {
  id: string;
  type: "user" | "ai" | "streaming";
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

const QUICK_REPLIES = [
  "Help me find my match",
  "Give me dating advice",
  "What makes a good bio?",
  "I'm feeling lonely",
];

export default function MaytriScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    profileName?: string;
    profileId?: string;
  }>();

  const {
    isConnected,
    isConnecting,
    connectionError,
    chats,
    currentChat,
    currentChatId,
    isLoadingChats,
    isSendingMessage,
    isCreatingChat,
    isLoadingChat,
    streamingMessage,
    error,
    connect,
    fetchChats,
    createNewChat,
    selectChat,
    sendMessage,
    clearError,
  } = useAIStore();

  const [inputText, setInputText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect();
    }
  }, [isConnected, isConnecting, connect]);

  useEffect(() => {
    if (!isConnected || isLoadingChats || isCreatingChat) return;

    if (!currentChatId) {
      if (chats.length > 0) {
        selectChat(chats[0].id);
      } else {
        createNewChat();
      }
    }
  }, [
    isConnected,
    isLoadingChats,
    isCreatingChat,
    chats.length,
    currentChatId,
    chats,
    createNewChat,
    selectChat,
  ]);

  const profileMessageSent = useRef(false);
  useEffect(() => {
    if (
      params.profileName &&
      params.profileId &&
      currentChatId &&
      isConnected &&
      !profileMessageSent.current &&
      !isSendingMessage
    ) {
      profileMessageSent.current = true;
      const contextMessage = `Tell me about ${params.profileName}. What should I know about them?`;
      sendMessage(contextMessage, params.profileId);
      router.setParams({ profileName: undefined, profileId: undefined } as any);
    }
  }, [
    params.profileName,
    params.profileId,
    currentChatId,
    isConnected,
    isSendingMessage,
    sendMessage,
    router,
  ]);

  const prevMessagesLength = useRef(0);
  useEffect(() => {
    const currentLength = currentChat?.messages?.length || 0;
    const hasNewMessage = currentLength > prevMessagesLength.current;
    const isStreaming = streamingMessage || isSendingMessage;

    if (hasNewMessage || isStreaming) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
      });
    }

    prevMessagesLength.current = currentLength;
  }, [currentChat?.messages?.length, streamingMessage, isSendingMessage]);

  const getDisplayMessages = useCallback((): DisplayMessage[] => {
    const messages: DisplayMessage[] = [];

    if (!currentChat?.messages || currentChat.messages.length === 0) {
      messages.push({
        id: "welcome",
        type: "ai",
        text: "Hey there! 💜 I'm Maytri, your AI matchmaker and love guru. I'm here to help you find meaningful connections based on personality, not just looks.\n\nTell me about yourself - what are you looking for in a partner? Or ask me anything about dating!",
        timestamp: new Date().toISOString(),
      });
    } else {
      currentChat.messages.forEach((msg) => {
        messages.push({
          id: msg.unique_id,
          type: msg.role === "user" ? "user" : "ai",
          text: msg.message,
          timestamp: msg.timestamp || new Date().toISOString(),
        });
      });
    }

    if (streamingMessage || isSendingMessage) {
      messages.push({
        id: "streaming",
        type: "streaming",
        text: streamingMessage || "",
        timestamp: new Date().toISOString(),
        isStreaming: true,
      });
    }

    return messages;
  }, [currentChat?.messages, streamingMessage, isSendingMessage]);

  const displayMessages = getDisplayMessages();

  const handleSend = useCallback(
    (text?: string) => {
      const messageText = text || inputText.trim();
      if (!messageText || isSendingMessage || isCreatingChat || !currentChatId)
        return;

      sendMessage(messageText);
      setInputText("");
    },
    [inputText, isSendingMessage, isCreatingChat, currentChatId, sendMessage],
  );

  const handleQuickReply = useCallback(
    (reply: string) => {
      handleSend(reply);
    },
    [handleSend],
  );

  const handleNewChat = useCallback(() => {
    createNewChat();
    setShowHistory(false);
  }, [createNewChat]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      selectChat(chatId);
      setShowHistory(false);
    },
    [selectChat],
  );

  const handleRetry = useCallback(() => {
    clearError();
    connect();
  }, [clearError, connect]);

  const renderMessage = useCallback(
    ({ item, index }: { item: DisplayMessage; index: number }) => {
      const isUser = item.type === "user";
      const isStreaming = item.type === "streaming";
      const isAI = item.type === "ai" || isStreaming;
      const isLastMessage = index === displayMessages.length - 1;
      const showQuickReplies =
        item.type === "ai" &&
        isLastMessage &&
        !isSendingMessage &&
        displayMessages.length <= 2;

      return (
        <View className={`mb-4 ${isUser ? "items-end" : "items-start"} px-4`}>
          {isAI && (
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2 overflow-hidden border border-primary">
                <Image
                  source={require("../../assets/maytri.jpg")}
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
              <Typography variant="label" color="primary">
                Maytri
              </Typography>
              {isStreaming && (
                <View className="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </View>
          )}

          <View
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-primary rounded-br-sm"
                : "bg-surface-elevated rounded-bl-sm"
            }`}
          >
            {isStreaming && !item.text ? (
              <View className="flex-row gap-1 py-1">
                <View className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                <View className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                <View className="w-2 h-2 rounded-full bg-muted animate-pulse" />
              </View>
            ) : (
              <Typography variant="body" className={isUser ? "text-white" : ""}>
                {item.text}
              </Typography>
            )}
          </View>

          {showQuickReplies && (
            <View className="flex-row flex-wrap gap-2 mt-3 max-w-[90%]">
              {QUICK_REPLIES.map((reply, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleQuickReply(reply)}
                  className="bg-surface border border-primary/30 rounded-full px-4 py-2 active:bg-primary/20"
                >
                  <Typography variant="caption" color="primary">
                    {reply}
                  </Typography>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      );
    },
    [displayMessages.length, isSendingMessage, handleQuickReply],
  );

  if (isConnecting && !isConnected) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 items-center justify-center">
          <StatusBar barStyle="light-content" />
          <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-4">
            <Sparkles size={32} color="#6A1BFF" />
          </View>
          <ActivityIndicator size="large" color="#6A1BFF" />
          <Typography variant="body" color="muted" className="mt-4">
            Connecting to Maytri...
          </Typography>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (connectionError || error) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <StatusBar barStyle="light-content" />
          <View className="w-20 h-20 rounded-full bg-surface-elevated items-center justify-center mb-4">
            <AlertCircle size={40} color="#EF4444" />
          </View>
          <Typography variant="h2" className="text-center mb-2">
            Connection Failed
          </Typography>
          <Typography variant="body" color="muted" className="text-center mb-6">
            {connectionError || error}
          </Typography>
          <Button variant="primary" onPress={handleRetry}>
            <View className="flex-row items-center gap-2">
              <RefreshCw size={18} color="#FFFFFF" />
              <Typography className="text-white">Try Again</Typography>
            </View>
          </Button>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (showHistory) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1">
          <StatusBar barStyle="light-content" />
          <View className="px-4 py-3 border-b border-surface-elevated flex-row justify-between items-center">
            <Pressable onPress={() => setShowHistory(false)}>
              <Typography variant="label" color="primary">
                Back
              </Typography>
            </Pressable>
            <Typography variant="h2">Chat History</Typography>
            <View className="w-10" />
          </View>

          {isLoadingChats ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#6A1BFF" />
            </View>
          ) : chats.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <MessageCircle size={48} color="#6A1BFF" />
              <Typography variant="h3" className="mt-4 mb-2">
                No Chat History
              </Typography>
              <Typography variant="body" color="muted" className="text-center">
                Start a new conversation with Maytri!
              </Typography>
            </View>
          ) : (
            <FlatList
              data={chats}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectChat(item.id)}
                  className={`mb-3 p-4 rounded-xl ${
                    item.id === currentChatId
                      ? "bg-primary/20 border border-primary"
                      : "bg-surface-elevated"
                  }`}
                >
                  <Typography variant="label" numberOfLines={1}>
                    {item.title || "New Chat"}
                  </Typography>
                  <Typography variant="caption" color="muted" className="mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Typography>
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView edges={["top"]} className="flex-1">
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View className="px-4 py-3 border-b border-surface-elevated">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3 border-2 border-primary overflow-hidden">
              <Image
                source={require("../../assets/maytri.jpg")}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Typography variant="h2" className="text-lg">
                  Maytri
                </Typography>
                <Badge label="AI" variant="ai" size="sm" />
                {isConnected && (
                  <View className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </View>
              <Typography variant="caption" color="muted">
                Your AI matchmaker & love guru
              </Typography>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  fetchChats();
                  setShowHistory(true);
                }}
                className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
              >
                <History size={20} color="#A6A6B2" />
              </Pressable>
              <Pressable
                onPress={handleNewChat}
                disabled={isCreatingChat}
                className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
              >
                {isCreatingChat ? (
                  <ActivityIndicator size="small" color="#A6A6B2" />
                ) : (
                  <Plus size={20} color="#A6A6B2" />
                )}
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "About Maytri",
                    "Maytri is your AI dating assistant designed to help you find meaningful connections.",
                  )
                }
                className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
              >
                <Info size={20} color="#A6A6B2" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Messages - Wrapped in KeyboardAvoidingView */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          className="flex-1"
        >
          {isLoadingChat ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#6A1BFF" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={displayMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 16 }}
              showsVerticalScrollIndicator={false}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
              removeClippedSubviews={false}
            />
          )}

          {/* Input Area */}
          <View className="px-4 py-3 border-t border-surface-elevated bg-surface">
            <View className="flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center bg-surface-elevated rounded-full px-4 py-2">
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask Maytri anything..."
                  placeholderTextColor="#A6A6B2"
                  className="flex-1 text-body text-base py-1"
                  style={{ color: "#E6E6F0" }}
                  multiline
                  maxLength={500}
                  onSubmitEditing={() => handleSend()}
                  editable={!isSendingMessage}
                />
              </View>

              <Pressable
                onPress={() => handleSend()}
                disabled={
                  !inputText.trim() ||
                  isSendingMessage ||
                  isCreatingChat ||
                  !currentChatId
                }
                className={`w-11 h-11 rounded-full items-center justify-center ${
                  inputText.trim() &&
                  !isSendingMessage &&
                  !isCreatingChat &&
                  currentChatId
                    ? "bg-primary active:bg-primary/80"
                    : "bg-surface-elevated"
                }`}
              >
                {isSendingMessage || isCreatingChat ? (
                  <ActivityIndicator size="small" color="#A6A6B2" />
                ) : (
                  <Send
                    size={20}
                    color={
                      inputText.trim() && currentChatId ? "#FFFFFF" : "#A6A6B2"
                    }
                  />
                )}
              </Pressable>
            </View>

            <View className="flex-row items-center justify-center mt-2">
              <Sparkles size={12} color="#FFD166" />
              <Typography
                variant="caption"
                color="muted"
                className="ml-1 text-xs"
              >
                Powered by Karma AI
              </Typography>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
