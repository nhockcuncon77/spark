// API Service - Backend Communication Layer
// This service handles all HTTP requests to the backend

import { config } from "@/constants/config";

const API_BASE_URL = config.api_host;

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // User endpoints
  async getCurrentUser() {
    return this.request<UserProfile>("/api/users/me");
  }

  async updateProfile(data: Partial<UserProfile>) {
    return this.request<UserProfile>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Feed/Discovery endpoints
  async getFeed() {
    return this.request<ProfileCard[]>("/api/feed");
  }

  async swipeProfile(profileId: string, action: "like" | "pass" | "superlike") {
    return this.request<SwipeResult>("/api/swipe", {
      method: "POST",
      body: JSON.stringify({ profileId, action }),
    });
  }

  async pokeUser(userId: string) {
    return this.request<{ success: boolean }>("/api/poke", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // Match endpoints
  async getMatches() {
    return this.request<Match[]>("/api/matches");
  }

  async rateMatch(matchId: string, rating: number) {
    return this.request<RatingResult>("/api/matches/rate", {
      method: "POST",
      body: JSON.stringify({ matchId, rating }),
    });
  }

  async requestUnlock(matchId: string) {
    return this.request<UnlockRequest>("/api/matches/unlock", {
      method: "POST",
      body: JSON.stringify({ matchId }),
    });
  }

  async respondToUnlock(matchId: string, accept: boolean) {
    return this.request<UnlockResponse>("/api/matches/unlock/respond", {
      method: "POST",
      body: JSON.stringify({ matchId, accept }),
    });
  }

  // Chat endpoints
  async getChats() {
    return this.request<Chat[]>("/api/chats");
  }

  async getChatMessages(chatId: string) {
    return this.request<Message[]>(`/api/chats/${chatId}/messages`);
  }

  async sendMessage(chatId: string, text: string) {
    return this.request<Message>(`/api/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  // Social/Posts endpoints
  async getPosts() {
    return this.request<Post[]>("/api/posts");
  }

  async createPost(content: string) {
    return this.request<Post>("/api/posts", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async likePost(postId: string) {
    return this.request<{ liked: boolean }>(`/api/posts/${postId}/like`, {
      method: "POST",
    });
  }

  async commentOnPost(postId: string, content: string) {
    return this.request<Comment>(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async repostPost(postId: string) {
    return this.request<Post>(`/api/posts/${postId}/repost`, {
      method: "POST",
    });
  }

  // AI endpoints
  async generateBio(hobbies: string[], traits: string[]) {
    return this.request<{ suggestion: string }>("/api/ai/generate-bio", {
      method: "POST",
      body: JSON.stringify({ hobbies, traits }),
    });
  }

  async suggestReply(chatId: string, context: string[]) {
    return this.request<{ suggestion: string }>("/api/ai/suggest-reply", {
      method: "POST",
      body: JSON.stringify({ chatId, context }),
    });
  }

  async getAIRecommendations(query: string) {
    return this.request<ProfileCard[]>("/api/ai/recommendations", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }

  async chatWithAI(
    message: string,
    conversationHistory: { role: string; content: string }[],
  ) {
    return this.request<{ reply: string; recommendations?: ProfileCard[] }>(
      "/api/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({ message, conversationHistory }),
      },
    );
  }
}

// Types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  bio: string;
  hobbies: string[];
  personalityTraits: Record<string, number>;
  photos: string[];
  isVerified: boolean;
  isPhotosRevealed: boolean;
}

export interface ProfileCard {
  id: string;
  firstName: string;
  age: number;
  bio: string;
  hobbies: string[];
  traits: string[];
  photos: string[];
  isRevealed: boolean;
  isVerified: boolean;
  matchScore: number;
  distance: string;
}

export interface SwipeResult {
  matched: boolean;
  matchId?: string;
  profile?: ProfileCard;
}

export interface Match {
  id: string;
  profile: ProfileCard;
  messagesCount: number;
  messagesRequired: number;
  isUnlockRequested: boolean;
  isUnlocked: boolean;
  rating?: number;
  createdAt: string;
}

export interface RatingResult {
  success: boolean;
  continued: boolean; // true if rating >= 7
  message: string;
}

export interface UnlockRequest {
  requested: boolean;
  message: string;
}

export interface UnlockResponse {
  unlocked: boolean;
  message: string;
}

export interface Chat {
  id: string;
  matchId: string;
  otherUser: {
    id: string;
    firstName: string;
    isRevealed: boolean;
    photo?: string;
  };
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
  messagesCount: number;
  messagesRequired: number;
  canUnlock: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  isAiSuggested: boolean;
}

export interface Post {
  id: string;
  user: {
    id: string;
    name: string;
    isRevealed: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  reposts: number;
  isLiked: boolean;
  isReposted: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  user: {
    id: string;
    name: string;
    isRevealed: boolean;
  };
  content: string;
  timestamp: string;
}

export const api = new ApiService();
export { api as default };
