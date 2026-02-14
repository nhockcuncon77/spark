// Activities Store - manages pokes, profile views, and superlikes
import { create } from "zustand";
import { graphqlClient } from "../services/graphql-client";
import { gql } from "urql";
import { UserPublic } from "../services/chat-service";

// ============= GraphQL Documents =============

const GET_PROFILE_ACTIVITIES = gql`
  query GetProfileActivities($class: ActivityClass) {
    profileActivities(class: $class) {
      id
      type
      target_user {
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
      class
    }
  }
`;

const CREATE_PROFILE_ACTIVITY = gql`
  mutation CreateProfileActivity($type: ActivityType!, $target_user_id: String!) {
    createProfileActivity(type: $type, target_user_id: $target_user_id) {
      id
      type
      target_user {
        id
        name
        pfp
      }
      class
    }
  }
`;

// ============= Types =============

export type ActivityType = "POKE" | "PROFILE_VIEW" | "SUPERLIKE";
export type ActivityClass = "RECEIVED" | "SENT";

export interface UserProfileActivity {
    id: string;
    type: ActivityType;
    target_user: UserPublic;
    class: ActivityClass;
}

// ============= Store State =============

interface ActivitiesState {
    // State
    receivedActivities: UserProfileActivity[];
    sentActivities: UserProfileActivity[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    lastFetched: number | null;

    // Actions
    fetchActivities: () => Promise<void>;
    refresh: () => Promise<void>;
    createActivity: (
        type: ActivityType,
        targetUserId: string
    ) => Promise<{ success: boolean; activity?: UserProfileActivity; error?: string }>;
    setError: (error: string | null) => void;
    clearError: () => void;
    reset: () => void;

    // Selectors (helper functions)
    getReceivedPokes: () => UserProfileActivity[];
    getSentPokes: () => UserProfileActivity[];
    getViewedYou: () => UserProfileActivity[];
    getYouViewed: () => UserProfileActivity[];
}

// ============= Store =============

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
    // Initial state
    receivedActivities: [],
    sentActivities: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastFetched: null,

    // Fetch all activities
    fetchActivities: async () => {
        const { isLoading } = get();
        if (isLoading) return;

        set({ isLoading: true, error: null });

        try {
            const [receivedResult, sentResult] = await Promise.all([
                graphqlClient
                    .query(GET_PROFILE_ACTIVITIES, { class: "RECEIVED" })
                    .toPromise(),
                graphqlClient
                    .query(GET_PROFILE_ACTIVITIES, { class: "SENT" })
                    .toPromise(),
            ]);

            if (receivedResult.error) {
                throw new Error(receivedResult.error.message);
            }
            if (sentResult.error) {
                throw new Error(sentResult.error.message);
            }

            set({
                receivedActivities: receivedResult.data?.profileActivities || [],
                sentActivities: sentResult.data?.profileActivities || [],
                isLoading: false,
                lastFetched: Date.now(),
            });
        } catch (error) {
            console.error("Fetch activities error:", error);
            set({
                error:
                    error instanceof Error ? error.message : "Failed to load activities",
                isLoading: false,
            });
        }
    },

    // Refresh activities (pull-to-refresh)
    refresh: async () => {
        set({ isRefreshing: true, error: null });

        try {
            const [receivedResult, sentResult] = await Promise.all([
                graphqlClient
                    .query(
                        GET_PROFILE_ACTIVITIES,
                        { class: "RECEIVED" },
                        { requestPolicy: "network-only" }
                    )
                    .toPromise(),
                graphqlClient
                    .query(
                        GET_PROFILE_ACTIVITIES,
                        { class: "SENT" },
                        { requestPolicy: "network-only" }
                    )
                    .toPromise(),
            ]);

            if (receivedResult.error) {
                throw new Error(receivedResult.error.message);
            }
            if (sentResult.error) {
                throw new Error(sentResult.error.message);
            }

            set({
                receivedActivities: receivedResult.data?.profileActivities || [],
                sentActivities: sentResult.data?.profileActivities || [],
                isRefreshing: false,
                lastFetched: Date.now(),
            });
        } catch (error) {
            console.error("Refresh activities error:", error);
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to refresh activities",
                isRefreshing: false,
            });
        }
    },

    // Create a new activity
    createActivity: async (type, targetUserId) => {
        try {
            const result = await graphqlClient
                .mutation(CREATE_PROFILE_ACTIVITY, {
                    type,
                    target_user_id: targetUserId,
                })
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            const activity = result.data?.createProfileActivity;

            if (activity) {
                // Add to sent activities optimistically
                set((state) => ({
                    sentActivities: [activity, ...state.sentActivities],
                }));
            }

            return { success: true, activity };
        } catch (error) {
            console.error("Create activity error:", error);
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to create activity",
            };
        }
    },

    // Set error
    setError: (error) => set({ error }),

    // Clear error
    clearError: () => set({ error: null }),

    // Reset store
    reset: () =>
        set({
            receivedActivities: [],
            sentActivities: [],
            isLoading: false,
            isRefreshing: false,
            error: null,
            lastFetched: null,
        }),

    // Selectors
    getReceivedPokes: () =>
        get().receivedActivities.filter((a) => a.type === "POKE"),

    getSentPokes: () =>
        get().sentActivities.filter((a) => a.type === "POKE"),

    getViewedYou: () =>
        get().receivedActivities.filter((a) => a.type === "PROFILE_VIEW"),

    getYouViewed: () =>
        get().sentActivities.filter((a) => a.type === "PROFILE_VIEW"),
}));

export default useActivitiesStore;
