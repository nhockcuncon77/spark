// Chat Messages Store - manages messages for individual chat rooms with WebSocket
import { create } from "zustand";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { config } from "@/constants/config";

// ============= Types =============

export interface Media {
    id: number;
    type: string;
    url: string;
    created_at: string;
}

export interface Reaction {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

export interface Message {
    id: string;
    type: string;
    content: string;
    sender_id: string;
    received: boolean;
    seen: boolean;
    media: Media[];
    reactions: Reaction[];
    created_at: string;
    updated_at?: string;
}

// WebSocket event types from backend
export type WSEventType =
    | "message_sent"
    | "message_received"
    | "message_seen"
    | "message_updated"
    | "typing_started"
    | "typing_stopped"
    | "reaction_added"
    | "reaction_removed"
    | "query_messages"
    | "error"
    | "unauthorized"
    | "end_chat"
    | "messages_query_success";

interface WSOutgoing {
    message?: Message[];
    event: WSEventType;
    error?: string;
}

interface WSIncoming {
    message?: Partial<Message>;
    reaction?: { message_id: string; reaction: string };
    event: WSEventType;
    mark_seen?: string[];
    message_query?: { limit: number; before_id?: string };
}

// ============= Chat Room State =============

interface ChatRoomState {
    messages: Message[];
    isLoading: boolean;
    hasMore: boolean;
    oldestMessageId: string | null;
}

// ============= Store State =============

interface ChatMessagesState {
    // Per-chat state
    chatRooms: Record<string, ChatRoomState>;

    // Active connection state
    activeChatId: string | null;
    ws: WebSocket | null;
    isConnected: boolean;
    isConnecting: boolean;
    isTyping: boolean;
    error: string | null;
    reconnectAttempts: number;

    // Actions
    connect: (chatId: string) => Promise<void>;
    disconnect: () => void;
    sendMessage: (message: Partial<Message>) => void;
    loadMessages: (limit?: number) => void;
    markSeen: (messageIds: string[]) => void;
    startTyping: () => void;
    stopTyping: () => void;
    addReaction: (messageId: string, reaction: string) => void;
    removeReaction: (messageId: string) => void;

    // Internal actions
    _handleWebSocketMessage: (data: WSOutgoing) => void;
    _attemptReconnect: () => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;

// ============= Store =============

export const useChatMessagesStore = create<ChatMessagesState>((set, get) => ({
    // Initial state
    chatRooms: {},
    activeChatId: null,
    ws: null,
    isConnected: false,
    isConnecting: false,
    isTyping: false,
    error: null,
    reconnectAttempts: 0,

    // Connect to chat room WebSocket
    connect: async (chatId: string) => {
        const { ws, activeChatId, isConnecting } = get();

        // Already connected to this chat
        if (activeChatId === chatId && ws?.readyState === WebSocket.OPEN) {
            return;
        }

        // Already connecting
        if (isConnecting) return;

        // Disconnect from previous chat
        if (ws) {
            ws.close();
        }

        set({ isConnecting: true, error: null, activeChatId: chatId });

        try {
            // Get access token
            let token: string | null;
            if (Platform.OS === "web") {
                token = localStorage.getItem(config.ACCESS_TOKEN_KEY);
            } else {
                token = await SecureStore.getItemAsync(config.ACCESS_TOKEN_KEY);
            }

            if (!token) {
                set({ error: "Not authenticated", isConnecting: false });
                return;
            }

            // Build WebSocket URL
            const wsProtocol = config.api_host.startsWith("https") ? "wss" : "ws";
            const wsHost = config.api_host.replace(/^https?:\/\//, "");
            const wsUrl = `${wsProtocol}://${wsHost}/v1/chat/ws/${chatId}?token=${token}`;

            const newWs = new WebSocket(wsUrl);

            newWs.onopen = () => {
                console.log(`WebSocket connected to chat ${chatId}`);
                set({
                    ws: newWs,
                    isConnected: true,
                    isConnecting: false,
                    reconnectAttempts: 0,
                });

                // Initialize chat room state if not exists
                const { chatRooms } = get();
                if (!chatRooms[chatId]) {
                    set({
                        chatRooms: {
                            ...chatRooms,
                            [chatId]: {
                                messages: [],
                                isLoading: false,
                                hasMore: true,
                                oldestMessageId: null,
                            },
                        },
                    });
                }

                // Load initial messages
                get().loadMessages(20);
            };

            newWs.onmessage = (event) => {
                try {
                    const data: WSOutgoing = JSON.parse(event.data);
                    get()._handleWebSocketMessage(data);
                } catch (e) {
                    console.error("Failed to parse WebSocket message:", e);
                }
            };

            newWs.onerror = (error) => {
                console.error("WebSocket error:", error);
                set({ error: "Connection error" });
            };

            newWs.onclose = () => {
                console.log(`WebSocket disconnected from chat ${chatId}`);
                set({ isConnected: false, ws: null });
                get()._attemptReconnect();
            };

            set({ ws: newWs });
        } catch (error) {
            console.error("WebSocket connect error:", error);
            set({
                error: error instanceof Error ? error.message : "Connection failed",
                isConnecting: false,
            });
        }
    },

    // Disconnect from WebSocket
    disconnect: () => {
        const { ws } = get();
        if (ws) {
            ws.close();
        }
        set({
            ws: null,
            isConnected: false,
            activeChatId: null,
            reconnectAttempts: MAX_RECONNECT_ATTEMPTS, // Prevent auto-reconnect
        });
    },

    // Send a message
    sendMessage: (message) => {
        const { ws, isConnected } = get();
        if (!ws || !isConnected) {
            set({ error: "Not connected" });
            return;
        }

        const payload: WSIncoming = {
            event: "message_sent",
            message: {
                ...message,
                created_at: new Date().toISOString(),
            },
        };

        ws.send(JSON.stringify(payload));
    },

    // Load messages (pagination)
    loadMessages: (limit = 20) => {
        const { ws, isConnected, activeChatId, chatRooms } = get();
        if (!ws || !isConnected || !activeChatId) {
            return;
        }

        const chatRoom = chatRooms[activeChatId];
        if (chatRoom?.isLoading) return;

        // Update loading state
        set({
            chatRooms: {
                ...chatRooms,
                [activeChatId]: {
                    ...chatRoom,
                    isLoading: true,
                },
            },
        });

        const payload: WSIncoming = {
            event: "query_messages",
            message_query: {
                limit,
                before_id: chatRoom?.oldestMessageId || undefined,
            },
        };

        ws.send(JSON.stringify(payload));
    },

    // Mark messages as seen
    markSeen: (messageIds) => {
        const { ws, isConnected } = get();
        if (!ws || !isConnected || messageIds.length === 0) return;

        const payload: WSIncoming = {
            event: "message_seen",
            mark_seen: messageIds,
        };

        ws.send(JSON.stringify(payload));
    },

    // Start typing indicator
    startTyping: () => {
        const { ws, isConnected } = get();
        if (!ws || !isConnected) return;

        ws.send(JSON.stringify({ event: "typing_started" }));
    },

    // Stop typing indicator
    stopTyping: () => {
        const { ws, isConnected } = get();
        if (!ws || !isConnected) return;

        ws.send(JSON.stringify({ event: "typing_stopped" }));
    },

    // Add reaction to message
    addReaction: (messageId, reaction) => {
        const { ws, isConnected } = get();
        if (!ws || !isConnected) return;

        const payload: WSIncoming = {
            event: "reaction_added",
            reaction: { message_id: messageId, reaction },
        };

        ws.send(JSON.stringify(payload));
    },

    // Remove reaction from message
    removeReaction: (messageId) => {
        const { ws, isConnected } = get();
        if (!ws || !isConnected) return;

        const payload: WSIncoming = {
            event: "reaction_removed",
            reaction: { message_id: messageId, reaction: "" },
        };

        ws.send(JSON.stringify(payload));
    },

    // Handle incoming WebSocket messages
    _handleWebSocketMessage: (data) => {
        const { activeChatId, chatRooms } = get();
        if (!activeChatId) return;

        const chatRoom = chatRooms[activeChatId] || {
            messages: [],
            isLoading: false,
            hasMore: true,
            oldestMessageId: null,
        };

        switch (data.event) {
            case "message_sent":
            case "message_received":
                // New message from other user
                if (data.message && data.message.length > 0) {
                    const newMessages = data.message;
                    set({
                        chatRooms: {
                            ...chatRooms,
                            [activeChatId]: {
                                ...chatRoom,
                                messages: [...chatRoom.messages, ...newMessages],
                            },
                        },
                    });
                }
                break;

            case "messages_query_success":
                // Response to query_messages
                if (data.message) {
                    const loadedMessages = data.message;
                    const oldestId = loadedMessages.length > 0
                        ? loadedMessages[0].id
                        : chatRoom.oldestMessageId;

                    set({
                        chatRooms: {
                            ...chatRooms,
                            [activeChatId]: {
                                ...chatRoom,
                                messages: [...loadedMessages, ...chatRoom.messages],
                                isLoading: false,
                                hasMore: loadedMessages.length > 0,
                                oldestMessageId: oldestId,
                            },
                        },
                    });
                } else {
                    set({
                        chatRooms: {
                            ...chatRooms,
                            [activeChatId]: {
                                ...chatRoom,
                                isLoading: false,
                                hasMore: false,
                            },
                        },
                    });
                }
                break;

            case "message_updated":
                // Message was edited
                if (data.message && data.message.length > 0) {
                    const updatedMessage = data.message[0];
                    set({
                        chatRooms: {
                            ...chatRooms,
                            [activeChatId]: {
                                ...chatRoom,
                                messages: chatRoom.messages.map((msg) =>
                                    msg.id === updatedMessage.id ? updatedMessage : msg
                                ),
                            },
                        },
                    });
                }
                break;

            case "message_seen":
                // Messages marked as seen
                if (data.message && data.message.length > 0) {
                    const seenMessages = new Set(data.message.map((m) => m.id));
                    set({
                        chatRooms: {
                            ...chatRooms,
                            [activeChatId]: {
                                ...chatRoom,
                                messages: chatRoom.messages.map((msg) =>
                                    seenMessages.has(msg.id) ? { ...msg, seen: true } : msg
                                ),
                            },
                        },
                    });
                }
                break;

            case "typing_started":
                set({ isTyping: true });
                break;

            case "typing_stopped":
                set({ isTyping: false });
                break;

            case "error":
                set({ error: data.error || "Unknown error" });
                break;

            case "unauthorized":
                set({ error: "Unauthorized" });
                get().disconnect();
                break;
        }
    },

    // Attempt to reconnect
    _attemptReconnect: () => {
        const { reconnectAttempts, activeChatId } = get();

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log("Max reconnect attempts reached");
            return;
        }

        if (!activeChatId) return;

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`Attempting reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);

        set({ reconnectAttempts: reconnectAttempts + 1 });

        setTimeout(() => {
            const { activeChatId: currentChatId } = get();
            if (currentChatId) {
                get().connect(currentChatId);
            }
        }, delay);
    },

    // Set error
    setError: (error) => set({ error }),

    // Reset store
    reset: () => {
        const { ws } = get();
        if (ws) {
            ws.close();
        }
        set({
            chatRooms: {},
            activeChatId: null,
            ws: null,
            isConnected: false,
            isConnecting: false,
            isTyping: false,
            error: null,
            reconnectAttempts: 0,
        });
    },
}));

export default useChatMessagesStore;
