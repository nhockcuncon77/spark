// Chat Service - GraphQL queries and WebSocket management
// Uses chats.graphqls schema and WebSocket handler from chat.go

import { graphqlClient } from "./graphql-client";
import { config } from "@/constants/config";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { gql } from "urql";

// ============= GraphQL Queries =============

const GET_MY_CONNECTIONS = gql`
  query GetMyConnections {
    getMyConnections {
      chat {
        id
        match_id
        created_at
      }
      match {
        id
        she_id
        he_id
        score
        post_unlock_rating {
          she_rating
          he_rating
        }
        is_unlocked
        matched_at
      }
      last_message
      unread_messages
      percentage_complete
      connection_profile {
        id
        name
        pfp
        bio
        dob
        gender
        hobbies
        interests
        user_prompts
        personality_traits {
          key
          value
        }
        photos
        is_verified
        created_at
        is_online
        extra {
          school
          work
          looking_for
          zodiac
          languages
          excercise
          drinking
          smoking
          kids
          religion
          ethnicity
          sexuality
        }
      }
    }
  }
`;

// ============= Types =============

export interface ExtraMetadata {
    school?: string;
    work?: string;
    looking_for: string[];
    zodiac?: string;
    languages: string[];
    excercise?: string;
    drinking?: string;
    smoking?: string;
    kids?: string;
    religion?: string;
    ethnicity?: string;
    sexuality?: string;
}

export interface UserPublic {
    id: string;
    name: string;
    pfp: string;
    bio: string;
    dob: string;
    gender: string;
    hobbies: string[];
    interests: string[];
    user_prompts: string[];
    personality_traits: { key: string; value: number }[];
    photos: string[];
    is_verified: boolean;
    created_at: string;
    is_online: boolean;
    extra?: ExtraMetadata;
}

export interface PostUnlockRating {
    she_rating: number;
    he_rating: number;
}

export interface Match {
    id: string;
    she_id: string;
    he_id: string;
    score: number;
    post_unlock_rating: PostUnlockRating;
    is_unlocked: boolean;
    matched_at: string;
    // Streak data (optional - populated when available)
    streak_count?: number;
    streak_at_risk?: boolean;
}

export interface Chat {
    id: string;
    match_id: string;
    created_at: string;
}

export interface Connection {
    chat: Chat;
    match: Match;
    last_message: string;
    unread_messages: number;
    percentage_complete: number;
    connection_profile: UserPublic;
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
}

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

// WebSocket event types
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

export interface WSOutgoing {
    message?: Message[];
    data?: unknown;
    event: WSEventType;
    error?: string;
}

export interface WSIncoming {
    message?: Partial<Message>;
    reaction?: { message_id: string; reaction: string };
    event: WSEventType;
    mark_seen?: string[];
    message_query?: { limit: number; before_id?: string };
}

// ============= Chat Service =============

class ChatService {
    /**
     * Get all connections for the current user
     */
    async getMyConnections(): Promise<{
        success: boolean;
        connections?: Connection[];
        error?: string;
    }> {
        try {
            const result = await graphqlClient
                .query(GET_MY_CONNECTIONS, {})
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            return {
                success: true,
                connections: result.data?.getMyConnections || [],
            };
        } catch (error) {
            console.error("Get connections error:", error);
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to get connections",
            };
        }
    }
}

// ============= WebSocket Manager =============

export class ChatWebSocket {
    private ws: WebSocket | null = null;
    private chatId: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    // Event handlers
    public onMessage?: (message: Message) => void;
    public onTypingStarted?: (userId: string) => void;
    public onTypingStopped?: (userId: string) => void;
    public onMessagesLoaded?: (messages: Message[]) => void;
    public onError?: (error: string) => void;
    public onConnected?: () => void;
    public onDisconnected?: () => void;

    constructor(chatId: string) {
        this.chatId = chatId;
    }

    async connect(): Promise<void> {
        try {
            // Get access token
            let token: string | null;
            if (Platform.OS === "web") {
                token = localStorage.getItem(config.ACCESS_TOKEN_KEY);
            } else {
                token = await SecureStore.getItemAsync(config.ACCESS_TOKEN_KEY);
            }

            if (!token) {
                this.onError?.("Not authenticated");
                return;
            }

            // Build WebSocket URL
            const wsProtocol = config.api_host.startsWith("https") ? "wss" : "ws";
            const wsHost = config.api_host.replace(/^https?:\/\//, "");
            const wsUrl = `${wsProtocol}://${wsHost}/v1/chat/ws/${this.chatId}?token=${token}`;

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log(`WebSocket connected to chat ${this.chatId}`);
                this.reconnectAttempts = 0;
                this.onConnected?.();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data: WSOutgoing = JSON.parse(event.data);
                    this.handleIncomingEvent(data);
                } catch (e) {
                    console.error("Failed to parse WebSocket message:", e);
                }
            };

            this.ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                this.onError?.("Connection error");
            };

            this.ws.onclose = () => {
                console.log(`WebSocket disconnected from chat ${this.chatId}`);
                this.onDisconnected?.();
                this.attemptReconnect();
            };
        } catch (error) {
            console.error("WebSocket connect error:", error);
            this.onError?.(
                error instanceof Error ? error.message : "Connection failed",
            );
        }
    }

    private handleIncomingEvent(data: WSOutgoing): void {
        switch (data.event) {
            case "message_sent":
                // New message from other user - this is the main event for receiving messages
                if (data.message && data.message.length > 0) {
                    data.message.forEach((msg) => this.onMessage?.(msg));
                }
                break;

            case "message_received":
                // Delivery confirmation for our sent messages
                if (data.message && data.message.length > 0) {
                    data.message.forEach((msg) => this.onMessage?.(msg));
                }
                break;

            case "message_updated":
                // Message was edited
                if (data.message && data.message.length > 0) {
                    data.message.forEach((msg) => this.onMessage?.(msg));
                }
                break;

            case "message_seen":
                // Messages were marked as seen
                if (data.message && data.message.length > 0) {
                    data.message.forEach((msg) => this.onMessage?.(msg));
                }
                break;

            case "messages_query_success":
                if (data.message) {
                    this.onMessagesLoaded?.(data.message);
                }
                break;

            case "typing_started":
                // Typing indicator - no data field needed
                this.onTypingStarted?.("");
                break;

            case "typing_stopped":
                // Typing stopped - no data field needed  
                this.onTypingStopped?.("");
                break;

            case "error":
                this.onError?.(data.error || "Unknown error");
                break;

            case "unauthorized":
                this.onError?.(data.error || "Unauthorized");
                this.disconnect();
                break;

            default:
                console.log("Unhandled WebSocket event:", data.event);
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log("Max reconnect attempts reached");
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(
            `Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`,
        );

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    sendMessage(message: Partial<Message>): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.onError?.("Not connected");
            return;
        }

        const payload: WSIncoming = {
            event: "message_sent",
            message: message,
        };

        this.ws.send(JSON.stringify(payload));
    }

    startTyping(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const payload: WSIncoming = {
            event: "typing_started",
        };

        this.ws.send(JSON.stringify(payload));
    }

    stopTyping(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const payload: WSIncoming = {
            event: "typing_stopped",
        };

        this.ws.send(JSON.stringify(payload));
    }

    markMessagesSeen(messageIds: string[]): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const payload: WSIncoming = {
            event: "message_seen",
            mark_seen: messageIds,
        };

        this.ws.send(JSON.stringify(payload));
    }

    queryMessages(limit: number = 20, beforeId?: string): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.onError?.("Not connected");
            return;
        }

        const payload: WSIncoming = {
            event: "query_messages",
            message_query: {
                limit,
                before_id: beforeId,
            },
        };

        this.ws.send(JSON.stringify(payload));
    }

    addReaction(messageId: string, reaction: string): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const payload: WSIncoming = {
            event: "reaction_added",
            reaction: {
                message_id: messageId,
                reaction,
            },
        };

        this.ws.send(JSON.stringify(payload));
    }

    removeReaction(messageId: string): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const payload: WSIncoming = {
            event: "reaction_removed",
            reaction: {
                message_id: messageId,
                reaction: "", // Not needed for removal
            },
        };

        this.ws.send(JSON.stringify(payload));
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export const chatService = new ChatService();
export default chatService;
