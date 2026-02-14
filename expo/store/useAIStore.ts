// AI Store - Zustand state management for Maytri AI features
// Manages WebSocket connection, chat sessions, and profile summaries

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import aiService, {
    AIChat,
    AIMessageContent,
    AIIncomingMessage,
} from "../services/ai-service";

// Types
export interface AIStoreState {
    // Connection
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;

    // Chats
    chats: AIChat[];
    currentChatId: string | null;
    currentChat: AIChat | null;

    // Loading states
    isLoadingChats: boolean;
    isSendingMessage: boolean;
    isCreatingChat: boolean;
    isLoadingChat: boolean;

    // Streaming
    streamingMessage: string;
    streamingMessageId: string | null;

    // Profile summaries
    profileSummaries: Record<string, string>;
    loadingProfileSummary: string | null;

    // Error
    error: string | null;
}

export interface AIStoreActions {
    // Connection
    connect: () => Promise<void>;
    disconnect: () => void;
    setConnectionStatus: (connected: boolean) => void;
    setConnectionError: (error: string | null) => void;

    // Chats
    fetchChats: () => void;
    fetchChat: (chatId: string) => void;
    createNewChat: () => void;
    selectChat: (chatId: string | null) => void;
    setChats: (chats: AIChat[]) => void;
    setCurrentChat: (chat: AIChat | null) => void;
    updateChatTitle: (chatId: string) => void;

    // Messages
    sendMessage: (message: string, profileUserId?: string) => void;
    appendStreamingChunk: (chunk: string) => void;
    finalizeStreamingMessage: () => void;
    addUserMessage: (message: string) => void;

    // Profile summaries
    fetchProfileSummary: (userId: string) => Promise<void>;
    setProfileSummary: (userId: string, summary: string) => void;

    // Loading
    setLoadingChats: (loading: boolean) => void;
    setSendingMessage: (sending: boolean) => void;
    setCreatingChat: (creating: boolean) => void;
    setLoadingChat: (loading: boolean) => void;

    // Error
    setError: (error: string | null) => void;
    clearError: () => void;

    // Cleanup
    reset: () => void;

    // Handle incoming messages
    handleIncomingMessage: (message: AIIncomingMessage) => void;
}

type AIStore = AIStoreState & AIStoreActions;

const initialState: AIStoreState = {
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    chats: [],
    currentChatId: null,
    currentChat: null,
    isLoadingChats: false,
    isSendingMessage: false,
    isCreatingChat: false,
    isLoadingChat: false,
    streamingMessage: "",
    streamingMessageId: null,
    profileSummaries: {},
    loadingProfileSummary: null,
    error: null,
};

// Track if event listeners are already registered (outside store to persist across calls)
let eventListenersRegistered = false;
let chatsFetched = false;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export const useAIStore = create<AIStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Connection
            connect: async () => {
                const { isConnected: alreadyConnected, isConnecting: alreadyConnecting } = get();
                if (alreadyConnected || alreadyConnecting) {
                    console.log("[AI Store] Already connected/connecting, skipping");
                    return;
                }

                console.log("[AI Store] Connecting...");
                set({ isConnecting: true, connectionError: null });

                // Set up event listeners only once
                if (!eventListenersRegistered) {
                    eventListenersRegistered = true;

                    aiService.onMessage((msg) =>
                        get().handleIncomingMessage(msg),
                    );

                    aiService.onConnection((connected) => {
                        console.log("[AI Store] Connection status:", connected);
                        set({ isConnected: connected, isConnecting: false });

                        if (connected) {
                            // Fetch chats only once ever (not on every reconnect)
                            if (!chatsFetched) {
                                console.log("[AI Store] Fetching chats (first time)");
                                get().fetchChats();
                                chatsFetched = true;
                            }

                            // Send online status on connect
                            aiService.sendOnlineStatus();

                            // Set up heartbeat every 5 minutes (only if not already set)
                            if (!heartbeatInterval) {
                                heartbeatInterval = setInterval(() => {
                                    if (aiService.isConnected()) {
                                        console.log("[AI Store] Sending online status heartbeat");
                                        aiService.sendOnlineStatus();
                                    }
                                }, 5 * 60 * 1000); // 5 minutes
                            }
                        }
                    });

                    aiService.onError((error) => {
                        console.error("[AI Store] Connection error:", error);
                        set({ connectionError: error, isConnecting: false });
                    });
                }

                await aiService.connect();
            },

            disconnect: () => {
                aiService.disconnect();
                set({ isConnected: false, isConnecting: false });
            },

            setConnectionStatus: (connected) => set({ isConnected: connected }),

            setConnectionError: (error) => set({ connectionError: error }),

            // Chats
            fetchChats: () => {
                console.log("[AI Store] Fetching chats...");
                set({ isLoadingChats: true });
                aiService.getChats();
            },

            fetchChat: (chatId) => {
                console.log("[AI Store] Fetching chat:", chatId);
                set({ isLoadingChat: true, currentChatId: chatId });
                aiService.getChat(chatId);
            },

            createNewChat: () => {
                console.log("[AI Store] Creating new chat...");
                set({ isCreatingChat: true });
                aiService.createNewChat();
            },

            selectChat: (chatId) => {
                const { chats } = get();
                const chat = chats.find((c) => c.id === chatId) || null;
                set({ currentChatId: chatId, currentChat: chat });
                if (chatId) {
                    get().fetchChat(chatId);
                }
            },

            setChats: (chats) => set({ chats, isLoadingChats: false }),

            setCurrentChat: (chat) =>
                set({ currentChat: chat, isLoadingChat: false }),

            updateChatTitle: (chatId) => {
                aiService.updateChatTitle(chatId);
            },

            // Messages
            sendMessage: (message, profileUserId) => {
                const { currentChatId, currentChat } = get();
                if (!currentChatId) return;

                // Add user message optimistically
                get().addUserMessage(message);

                set({ isSendingMessage: true, streamingMessage: "" });

                let messageId: string;
                if (profileUserId) {
                    messageId = aiService.askAboutProfile(
                        currentChatId,
                        message,
                        profileUserId,
                    );
                } else {
                    messageId = aiService.sendMessage(currentChatId, message);
                }

                set({ streamingMessageId: messageId });
            },

            appendStreamingChunk: (chunk) => {
                set((state) => ({
                    streamingMessage: state.streamingMessage + chunk,
                }));
            },

            finalizeStreamingMessage: () => {
                const { streamingMessage, currentChat, currentChatId } = get();

                if (streamingMessage && currentChat) {
                    const newMessage: AIMessageContent = {
                        unique_id: `ai_${Date.now()}`,
                        role: "assistant",
                        message: streamingMessage,
                    };

                    const existingMessages = currentChat.messages || [];
                    const updatedChat = {
                        ...currentChat,
                        messages: [...existingMessages, newMessage],
                    };

                    set((state) => ({
                        currentChat: updatedChat,
                        chats: state.chats.map((c) =>
                            c.id === currentChatId ? updatedChat : c,
                        ),
                        streamingMessage: "",
                        streamingMessageId: null,
                        isSendingMessage: false,
                    }));

                    // Update chat title after first exchange
                    if (existingMessages.length <= 2) {
                        get().updateChatTitle(currentChatId!);
                    }
                } else {
                    set({
                        streamingMessage: "",
                        streamingMessageId: null,
                        isSendingMessage: false,
                    });
                }
            },

            addUserMessage: (message) => {
                const { currentChat, currentChatId } = get();
                if (!currentChat) return;

                const newMessage: AIMessageContent = {
                    unique_id: `user_${Date.now()}`,
                    role: "user",
                    message,
                };

                const existingMessages = currentChat.messages || [];
                const updatedChat = {
                    ...currentChat,
                    messages: [...existingMessages, newMessage],
                };

                set((state) => ({
                    currentChat: updatedChat,
                    chats: state.chats.map((c) =>
                        c.id === currentChatId ? updatedChat : c,
                    ),
                }));
            },

            // Profile summaries
            fetchProfileSummary: async (userId) => {
                const { profileSummaries, loadingProfileSummary } = get();

                // Check cache first
                if (profileSummaries[userId]) {
                    return;
                }

                // Avoid duplicate requests for the same user
                if (loadingProfileSummary === userId) {
                    return;
                }

                set({ loadingProfileSummary: userId });

                await aiService.getProfileSummary(
                    userId,
                    (chunk) => {
                        // Update store on each chunk for real-time streaming effect
                        set((state) => ({
                            profileSummaries: {
                                ...state.profileSummaries,
                                [userId]: (state.profileSummaries[userId] || "") + chunk,
                            },
                        }));
                    },
                    (_fullText) => {
                        // Finalize loading state (summary already built from chunks)
                        set({ loadingProfileSummary: null });
                    },
                    (error) => {
                        console.error("[AI Store] Profile summary error:", error);
                        set({ loadingProfileSummary: null, error });
                    },
                );
            },

            setProfileSummary: (userId, summary) => {
                set((state) => ({
                    profileSummaries: {
                        ...state.profileSummaries,
                        [userId]: summary,
                    },
                }));
            },

            // Loading
            setLoadingChats: (loading) => set({ isLoadingChats: loading }),
            setSendingMessage: (sending) => set({ isSendingMessage: sending }),
            setCreatingChat: (creating) => set({ isCreatingChat: creating }),
            setLoadingChat: (loading) => set({ isLoadingChat: loading }),

            // Error
            setError: (error) => set({ error }),
            clearError: () => set({ error: null }),

            // Cleanup
            reset: () => {
                get().disconnect();
                set(initialState);
            },

            // Handle incoming messages
            handleIncomingMessage: (message) => {
                const { currentChatId } = get();

                switch (message.type) {
                    case "get_chats":
                        const chatsList = (message.data as AIChat[]) || [];
                        console.log("[AI Store] get_chats received:", chatsList.length, "chats");
                        set({
                            chats: chatsList,
                            isLoadingChats: false,
                        });
                        break;

                    case "get_chat":
                        if (message.data) {
                            const chat = message.data as AIChat;
                            set((state) => ({
                                currentChat: chat,
                                isLoadingChat: false,
                                chats: state.chats.map((c) => (c.id === chat.id ? chat : c)),
                            }));
                        }
                        break;

                    case "create_new_chat":
                        console.log("[AI Store] create_new_chat response:", JSON.stringify(message));

                        // Backend returns chat as string ID (e.g., "6a_0cb7xtp") or as object
                        const chatValue = message.data?.chat;
                        let chatId: string | undefined;

                        if (typeof chatValue === "string") {
                            // Backend returned just the chat ID
                            chatId = chatValue;
                        } else if (chatValue && typeof chatValue === "object" && chatValue.id) {
                            // Backend returned a chat object
                            chatId = chatValue.id;
                        }

                        if (chatId) {
                            // Create a minimal chat object from the ID
                            const newChat: AIChat = {
                                id: chatId,
                                title: "New Chat",
                                user_id: "",
                                messages: [],
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            };
                            console.log("[AI Store] Setting new chat:", newChat.id);
                            set((state) => ({
                                chats: [newChat, ...state.chats],
                                currentChatId: newChat.id,
                                currentChat: newChat,
                                isCreatingChat: false,
                            }));
                        } else {
                            // Handle case where chat creation response is malformed
                            console.error("[AI Store] create_new_chat response malformed:", message);
                            set({ isCreatingChat: false, error: "Failed to create chat" });
                        }
                        break;

                    case "chat_completion":
                        // Streaming response chunk
                        const chunk = message.message;
                        const isDone = message.data?.done === true || message.data?.finished === true;

                        if (chunk && chunk.trim()) {
                            get().appendStreamingChunk(chunk);
                        }

                        // Finalize only when explicitly done or empty message signals end
                        if (isDone || (message.id && chunk === "")) {
                            get().finalizeStreamingMessage();
                        }
                        break;

                    case "update_chat_title":
                        if (message.data?.title && message.chatId) {
                            const newTitle = message.data.title as string;
                            set((state) => ({
                                chats: state.chats.map((c) =>
                                    c.id === message.chatId
                                        ? { ...c, title: newTitle }
                                        : c,
                                ),
                                currentChat:
                                    state.currentChat?.id === message.chatId && state.currentChat
                                        ? { ...state.currentChat, title: newTitle }
                                        : state.currentChat,
                            }));
                        }
                        break;

                    case "error":
                        set({
                            error: message.error || "Unknown error",
                            isSendingMessage: false,
                            isLoadingChats: false,
                            isCreatingChat: false,
                            isLoadingChat: false,
                        });
                        get().finalizeStreamingMessage();
                        break;
                }
            },
        }),
        {
            name: "spark-ai-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (_state) => ({
                // Don't persist profileSummaries to prevent stale cache issues
                // Summaries will be fetched fresh each session
            }),
        },
    ),
);

export default useAIStore;
