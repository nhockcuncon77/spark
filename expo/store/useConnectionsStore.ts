// Connections Store - manages chat connections list
import { create } from "zustand";
import { Connection } from "../services/chat-service";
import { graphqlClient } from "../services/graphql-client";
import { gql } from "urql";

// ============= GraphQL Query =============

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

// ============= Store State =============

interface ConnectionsState {
    // State
    connections: Connection[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    lastFetched: number | null;

    // Actions
    fetchConnections: () => Promise<void>;
    refresh: () => Promise<void>;
    setError: (error: string | null) => void;
    clearError: () => void;
    reset: () => void;
}

// ============= Store =============

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
    // Initial state
    connections: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastFetched: null,

    // Fetch connections from server
    fetchConnections: async () => {
        const { isLoading } = get();
        if (isLoading) return;

        set({ isLoading: true, error: null });

        try {
            const result = await graphqlClient
                .query(GET_MY_CONNECTIONS, {})
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            set({
                connections: result.data?.getMyConnections || [],
                isLoading: false,
                lastFetched: Date.now(),
            });
        } catch (error) {
            console.error("Fetch connections error:", error);
            set({
                error: error instanceof Error ? error.message : "Failed to load connections",
                isLoading: false,
            });
        }
    },

    // Refresh connections (pull-to-refresh)
    refresh: async () => {
        set({ isRefreshing: true, error: null });

        try {
            const result = await graphqlClient
                .query(GET_MY_CONNECTIONS, {}, { requestPolicy: "network-only" })
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            set({
                connections: result.data?.getMyConnections || [],
                isRefreshing: false,
                lastFetched: Date.now(),
            });
        } catch (error) {
            console.error("Refresh connections error:", error);
            set({
                error: error instanceof Error ? error.message : "Failed to refresh connections",
                isRefreshing: false,
            });
        }
    },

    // Set error
    setError: (error) => set({ error }),

    // Clear error
    clearError: () => set({ error: null }),

    // Reset store
    reset: () =>
        set({
            connections: [],
            isLoading: false,
            isRefreshing: false,
            error: null,
            lastFetched: null,
        }),
}));

export default useConnectionsStore;
