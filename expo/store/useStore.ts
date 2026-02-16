import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ============= Types =============

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age?: number;
  bio: string;
  hobbies: string[];
  personalityTraits: Record<string, number>;
  photos: string[];
  interests?: string[];
  user_prompts?: string[];
  isVerified: boolean;
  isPhotosRevealed: boolean;
  extra?: {
    school?: string;
    work?: string;
    looking_for?: string[];
    zodiac?: string;
    languages?: string[];
    excercise?: string;
    drinking?: string;
    smoking?: string;
    kids?: string;
    religion?: string;
    ethnicity?: string;
    sexuality?: string;
  };
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

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  isAiSuggested: boolean;
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
  messages: ChatMessage[];
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
  messagesCount: number;
  messagesRequired: number;
  canUnlock: boolean;
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

export interface MaytriMessage {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: string;
  recommendations?: ProfileCard[];
  quickReplies?: string[];
}

export interface MaytriSession {
  id: string;
  title: string;
  date: string;
  messages: MaytriMessage[];
}

export interface Poke {
  id: string;
  userId: string;
  type: "sent" | "received";
  timestamp: string;
  isSeen: boolean;
}

export interface ProfileView {
  id: string;
  userId: string;
  type: "viewed_you" | "you_viewed";
  timestamp: string;
}

export interface SwipeAction {
  profileId: string;
  action: "like" | "pass" | "superlike";
  timestamp: string;
}

// ============= State Interface =============

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  accessToken: string | null;
}

interface OnboardingState {
  onboardingStep: number;
  onboardingData: Partial<UserProfile>;
  isOnboardingComplete: boolean;
}

interface DiscoveryState {
  profiles: ProfileCard[];
  currentIndex: number;
  isLoadingProfiles: boolean;
  swipeHistory: SwipeAction[];
}

interface MatchState {
  matches: Match[];
  pendingMatches: Match[];
  isLoadingMatches: boolean;
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoadingChats: boolean;
}

interface SocialState {
  posts: Post[];
  isLoadingPosts: boolean;
}

interface AIState {
  aiSuggestions: string[];
  isAiLoading: boolean;
  aiConversationHistory: { role: "user" | "assistant"; content: string }[];
  maytriMessages: MaytriMessage[];
  maytriSessions: MaytriSession[];
}

interface InteractionState {
  pokes: Poke[];
  profileViews: ProfileView[];
}

interface AppState
  extends
  AuthState,
  OnboardingState,
  DiscoveryState,
  MatchState,
  ChatState,
  SocialState,
  AIState,
  InteractionState {
  // Auth Actions
  setUser: (user: UserProfile) => void;
  setAccessToken: (token: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;

  // Onboarding Actions
  setOnboardingStep: (step: number) => void;
  updateOnboardingData: (data: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Discovery Actions
  setProfiles: (profiles: ProfileCard[]) => void;
  addProfiles: (profiles: ProfileCard[]) => void;
  swipeProfile: (action: "like" | "pass" | "superlike") => ProfileCard | null;
  resetDiscovery: () => void;
  setCurrentIndex: (index: number) => void;

  // Match Actions
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  removeMatch: (matchId: string) => void;
  requestUnlock: (matchId: string) => void;
  acceptUnlock: (matchId: string) => void;
  rateMatch: (matchId: string, rating: number) => void;

  // Chat Actions
  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  addMessage: (chatId: string, message: ChatMessage) => void;
  markChatAsRead: (chatId: string) => void;
  updateChatUnlockStatus: (chatId: string) => void;

  // Social Actions
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  likePost: (postId: string) => void;
  repostPost: (postId: string) => void;

  // AI Actions
  setAiSuggestions: (suggestions: string[]) => void;
  setAiLoading: (loading: boolean) => void;
  addAiMessage: (role: "user" | "assistant", content: string) => void;
  clearAiHistory: () => void;
  setMaytriMessages: (messages: MaytriMessage[]) => void;
  addMaytriMessage: (message: MaytriMessage) => void;
  clearMaytriMessages: () => void;
  saveMaytriSession: (session: MaytriSession) => void;
  deleteMaytriSession: (sessionId: string) => void;

  // Interaction Actions
  addPoke: (poke: Poke) => void;
  markPokeAsSeen: (pokeId: string) => void;
  addProfileView: (view: ProfileView) => void;
}

// ============= Initial State =============

const initialState: Omit<
  AppState,
  | "setUser"
  | "setAccessToken"
  | "setAuthLoading"
  | "login"
  | "logout"
  | "setOnboardingStep"
  | "updateOnboardingData"
  | "completeOnboarding"
  | "resetOnboarding"
  | "setProfiles"
  | "addProfiles"
  | "swipeProfile"
  | "resetDiscovery"
  | "setCurrentIndex"
  | "setMatches"
  | "addMatch"
  | "updateMatch"
  | "removeMatch"
  | "requestUnlock"
  | "acceptUnlock"
  | "rateMatch"
  | "setChats"
  | "setActiveChat"
  | "addMessage"
  | "markChatAsRead"
  | "updateChatUnlockStatus"
  | "setPosts"
  | "addPost"
  | "likePost"
  | "repostPost"
  | "setAiSuggestions"
  | "setAiLoading"
  | "addAiMessage"
  | "clearAiHistory"
  | "setMaytriMessages"
  | "addMaytriMessage"
  | "clearMaytriMessages"
  | "saveMaytriSession"
  | "deleteMaytriSession"
  | "addPoke"
  | "markPokeAsSeen"
  | "addProfileView"
> = {
  // Auth
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,

  // Onboarding
  onboardingStep: 0,
  onboardingData: {},
  isOnboardingComplete: false,

  // Discovery
  profiles: [],
  currentIndex: 0,
  isLoadingProfiles: false,
  swipeHistory: [],

  // Matches
  matches: [],
  pendingMatches: [],
  isLoadingMatches: false,

  // Chats
  chats: [],
  activeChat: null,
  isLoadingChats: false,

  // Social
  posts: [],
  isLoadingPosts: false,

  // AI
  aiSuggestions: [],
  isAiLoading: false,
  aiConversationHistory: [],
  maytriMessages: [],
  maytriSessions: [],
  pokes: [],
  profileViews: [],
};

// ============= Store =============

// On web, skip rehydration entirely so we never overwrite auth that restoreSession just set from localStorage.
// The app always starts from initial state; restoreSession then sets auth from spark_access_token + spark_user.
function storageWithWebAuthSkip(base: StateStorage): StateStorage {
  if (Platform.OS !== "web") return base;
  return {
    getItem: () => Promise.resolve(null),
    setItem: base.setItem,
    removeItem: base.removeItem,
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============= Auth Actions =============
      setUser: (user) => set({ user, isAuthenticated: true }),

      setAccessToken: (token) => set({ accessToken: token }),

      setAuthLoading: (loading) => set({ isLoading: loading }),

      login: (user, token) =>
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isOnboardingComplete: false,
          onboardingStep: 0,
          onboardingData: {},
          matches: [],
          chats: [],
          swipeHistory: [],
          aiConversationHistory: [],
        }),

      // ============= Onboarding Actions =============
      setOnboardingStep: (step) => set({ onboardingStep: step }),

      updateOnboardingData: (data) =>
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data },
        })),

      completeOnboarding: () =>
        set({
          isOnboardingComplete: true,
          onboardingStep: 0,
        }),

      resetOnboarding: () =>
        set({
          onboardingStep: 0,
          onboardingData: {},
          isOnboardingComplete: false,
        }),

      // ============= Discovery Actions =============
      setProfiles: (profiles) => set({ profiles, currentIndex: 0 }),

      addProfiles: (profiles) =>
        set((state) => ({
          profiles: [...state.profiles, ...profiles],
        })),

      swipeProfile: (action) => {
        const state = get();
        const { profiles, currentIndex, swipeHistory } = state;

        if (currentIndex >= profiles.length) {
          return null;
        }

        const currentProfile = profiles[currentIndex];
        const swipeAction: SwipeAction = {
          profileId: currentProfile.id,
          action,
          timestamp: new Date().toISOString(),
        };

        set({
          currentIndex: currentIndex + 1,
          swipeHistory: [...swipeHistory, swipeAction],
        });

        return currentProfile;
      },

      resetDiscovery: () =>
        set({
          currentIndex: 0,
          swipeHistory: [],
        }),

      setCurrentIndex: (index) => set({ currentIndex: index }),

      // ============= Match Actions =============
      setMatches: (matches) => set({ matches }),

      addMatch: (match) =>
        set((state) => ({
          matches: [match, ...state.matches],
        })),

      updateMatch: (matchId, updates) =>
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, ...updates } : m,
          ),
        })),

      removeMatch: (matchId) =>
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== matchId),
        })),

      requestUnlock: (matchId) =>
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, isUnlockRequested: true } : m,
          ),
        })),

      acceptUnlock: (matchId) =>
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, isUnlocked: true } : m,
          ),
        })),

      rateMatch: (matchId, rating) =>
        set((state) => {
          const continued = rating >= 7;
          return {
            matches: state.matches
              .map((m) => (m.id === matchId ? { ...m, rating } : m))
              .filter((m) => m.id !== matchId || continued),
          };
        }),

      // ============= Chat Actions =============
      setChats: (chats) => set({ chats }),

      setActiveChat: (chat) => set({ activeChat: chat }),

      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id === chatId) {
              const newMessagesCount = chat.messagesCount + 1;
              return {
                ...chat,
                messages: [...chat.messages, message],
                lastMessage: message.text,
                updatedAt: message.timestamp,
                messagesCount: newMessagesCount,
                canUnlock: newMessagesCount >= chat.messagesRequired,
              };
            }
            return chat;
          }),
          activeChat:
            state.activeChat?.id === chatId
              ? {
                ...state.activeChat,
                messages: [...state.activeChat.messages, message],
                messagesCount: state.activeChat.messagesCount + 1,
                canUnlock:
                  state.activeChat.messagesCount + 1 >=
                  state.activeChat.messagesRequired,
              }
              : state.activeChat,
        })),

      markChatAsRead: (chatId) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat,
          ),
        })),

      updateChatUnlockStatus: (chatId) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                ...chat,
                otherUser: { ...chat.otherUser, isRevealed: true },
              }
              : chat,
          ),
        })),

      // ============= Social Actions =============
      setPosts: (posts) => set({ posts }),

      addPost: (post) =>
        set((state) => ({
          posts: [post, ...state.posts],
        })),

      likePost: (postId) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId
              ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              }
              : post,
          ),
        })),

      repostPost: (postId) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId
              ? {
                ...post,
                isReposted: !post.isReposted,
                reposts: post.isReposted
                  ? post.reposts - 1
                  : post.reposts + 1,
              }
              : post,
          ),
        })),

      // ============= AI Actions =============
      setAiSuggestions: (suggestions) => set({ aiSuggestions: suggestions }),

      setAiLoading: (loading) => set({ isAiLoading: loading }),

      addAiMessage: (role, content) =>
        set((state) => ({
          aiConversationHistory: [
            ...state.aiConversationHistory,
            { role, content },
          ],
        })),

      clearAiHistory: () => set({ aiConversationHistory: [] }),

      setMaytriMessages: (messages) => set({ maytriMessages: messages }),

      addMaytriMessage: (message) =>
        set((state) => ({
          maytriMessages: [...state.maytriMessages, message],
        })),

      clearMaytriMessages: () => set({ maytriMessages: [] }),

      saveMaytriSession: (session) =>
        set((state) => ({
          maytriSessions: [...state.maytriSessions, session],
        })),

      deleteMaytriSession: (sessionId) =>
        set((state) => ({
          maytriSessions: state.maytriSessions.filter(
            (s) => s.id !== sessionId,
          ),
        })),

      // ============= Interaction Actions =============
      addPoke: (poke) =>
        set((state) => ({
          pokes: [poke, ...state.pokes],
        })),

      markPokeAsSeen: (pokeId) =>
        set((state) => ({
          pokes: state.pokes.map((p) =>
            p.id === pokeId ? { ...p, isSeen: true } : p,
          ),
        })),

      addProfileView: (view) =>
        set((state) => ({
          profileViews: [view, ...state.profileViews],
        })),
    }),
    {
      name: "spark-storage",
      storage: createJSONStorage(() => storageWithWebAuthSkip(AsyncStorage as unknown as StateStorage)),
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        isOnboardingComplete: state.isOnboardingComplete,
        onboardingData: state.onboardingData,
        swipeHistory: state.swipeHistory,
        maytriMessages: state.maytriMessages,
        maytriSessions: state.maytriSessions,
        pokes: state.pokes,
        profileViews: state.profileViews,
      }),
    },
  ),
);

export default useStore;
