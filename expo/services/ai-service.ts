import { config } from "@/constants/config";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type AIMessageType =
  | "chat_completion"
  | "create_new_chat"
  | "get_chat"
  | "get_chats"
  | "profile_about"
  | "update_chat_title";

export type AIResponseType =
  | "chat_completion"
  | "create_new_chat"
  | "get_chat"
  | "get_chats"
  | "update_chat_title"
  | "error";

export interface AIMessageContent {
  unique_id: string;
  role: "user" | "assistant";
  message: string;
  timestamp?: string;
}

export interface AIChat {
  id: string;
  title: string;
  user_id: string;
  messages: AIMessageContent[];
  created_at: string;
  updated_at: string;
}

export interface AIOutgoingMessage {
  type: AIMessageType;
  message?: string;
  chatId?: string;
  id?: string;
  data?: { user_id: string };
}

export interface AIIncomingMessage {
  type: AIResponseType;
  message?: string;
  id?: string;
  chatId?: string;
  error?: string;
  data?: any;
}

export type OnMessageCallback = (message: AIIncomingMessage) => void;
export type OnConnectionCallback = (connected: boolean) => void;
export type OnErrorCallback = (error: string) => void;

class AIService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageCallbacks: Set<OnMessageCallback> = new Set();
  private connectionCallbacks: Set<OnConnectionCallback> = new Set();
  private errorCallbacks: Set<OnErrorCallback> = new Set();
  private pendingMessages: AIOutgoingMessage[] = [];
  private isConnecting = false;

  private getWsUrl(): string {
    const apiHost = config.api_host;

    const wsProtocol = apiHost.startsWith("https") ? "wss" : "ws";
    const wsHost = apiHost.replace(/^https?/, wsProtocol);
    return `${wsHost}/v1/ai/chat`;
  }

  private async getAccessToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(config.ACCESS_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(config.ACCESS_TOKEN_KEY);
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const token = await this.getAccessToken();

    if (!token) {
      this.isConnecting = false;
      this.notifyError("No access token available");
      return;
    }

    const wsUrl = `${this.getWsUrl()}?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[AI Service] WebSocket connected");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnection(true);
        this.flushPendingMessages();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: AIIncomingMessage = JSON.parse(event.data);
          this.notifyMessage(message);
        } catch (error) {
          console.error("[AI Service] Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[AI Service] WebSocket error:", error);
        this.notifyError("WebSocket connection error");
      };

      this.ws.onclose = (event) => {
        console.log("[AI Service] WebSocket closed:", event.code, event.reason);
        this.isConnecting = false;
        this.notifyConnection(false);
        this.attemptReconnect();
      };
    } catch (error) {
      this.isConnecting = false;
      console.error("[AI Service] Failed to create WebSocket:", error);
      this.notifyError("Failed to connect to AI service");
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyError("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[AI Service] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(message: AIOutgoingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.pendingMessages.push(message);
      this.connect();
    }
  }

  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  onMessage(callback: OnMessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onConnection(callback: OnConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onError(callback: OnErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  private notifyMessage(message: AIIncomingMessage): void {
    this.messageCallbacks.forEach((cb) => cb(message));
  }

  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => cb(connected));
  }

  private notifyError(error: string): void {
    this.errorCallbacks.forEach((cb) => cb(error));
  }

  getChats(): void {
    this.send({ type: "get_chats", id: `get_chats_${Date.now()}` });
  }

  getChat(chatId: string): void {
    this.send({ type: "get_chat", chatId, id: `get_chat_${Date.now()}` });
  }

  createNewChat(): void {
    this.send({ type: "create_new_chat", id: `create_chat_${Date.now()}` });
  }

  sendMessage(chatId: string, message: string): string {
    const id = `msg_${Date.now()}`;
    this.send({ type: "chat_completion", chatId, message, id });
    return id;
  }

  askAboutProfile(chatId: string, message: string, userId: string): string {
    const id = `profile_${Date.now()}`;
    this.send({
      type: "profile_about",
      chatId,
      message,
      id,
      data: { user_id: userId },
    });
    return id;
  }

  updateChatTitle(chatId: string): void {
    this.send({
      type: "update_chat_title",
      chatId,
      id: `title_${Date.now()}`,
    });
  }

  sendOnlineStatus(): void {
    this.send({
      type: "online_status" as any,
      id: `status_${Date.now()}`,
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async getProfileSummary(
    userId: string,
    onChunk: (text: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: string) => void,
  ): Promise<void> {
    const token = await this.getAccessToken();

    if (!token) {
      onError("No access token available");
      return;
    }

    const url = `${config.api_host}/v1/ai/summarize_profile/${userId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
      });

      if (!response.ok) {
        onError(`HTTP ${response.status}`);
        return;
      }

      const text = await response.text();

      if (!text) {
        onError("Empty response");
        return;
      }

      let fullText = "";
      const lines = text.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("data: ")) {
          try {
            const jsonData = trimmedLine.slice(6);
            const data = JSON.parse(jsonData);

            if (data.text) {
              fullText += data.text;
              onChunk(data.text);
            }
          } catch {}
        } else if (trimmedLine && !trimmedLine.startsWith(":")) {
          try {
            const data = JSON.parse(trimmedLine);
            if (data.text) {
              fullText += data.text;
              onChunk(data.text);
            }
          } catch {}
        }
      }

      onComplete(fullText);
    } catch (error) {
      console.error("[AI Service] SSE error:", error);
      onError(error instanceof Error ? error.message : "SSE connection failed");
    }
  }
}

export const aiService = new AIService();
export default aiService;
