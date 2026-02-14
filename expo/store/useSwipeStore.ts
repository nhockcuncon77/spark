// Swipe Store - manages recommendations and swipe actions
import { create } from "zustand";
import { graphqlClient } from "../services/graphql-client";
import { gql } from "urql";
import { UserPublic } from "../services/chat-service";

// ============= GraphQL Documents =============

// ============= Filter Type =============

export interface RecommendationFilter {
    gender?: string;
    min_age?: number;
    max_age?: number;
    max_distance_km?: number;
    verified_only?: boolean;
}

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($cursor: String, $limit: Int, $filter: RecommendationFilter) {
    recommendations(cursor: $cursor, limit: $limit, filter: $filter) {
      items {
        profile {
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
        match_score
        compatibility_score
        common_interests
        distance_km
        reason
      }
      next_cursor
      has_more
      fetched_at
    }
  }
`;

const SWIPE_MUTATION = gql`
  mutation Swipe($target_id: String!, $action_type: SwipeType!) {
    swipe(target_id: $target_id, action_type: $action_type) {
      swipe {
        id
        user_id
        target_id
        action_type
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
    }
  }
`;

// ============= Types =============

export type SwipeType = "LIKE" | "SUPERLIKE" | "DISLIKE";

export interface RecommendedProfile {
    profile: UserPublic;
    match_score: number;
    compatibility_score: number;
    common_interests: string[];
    distance_km: number | null;
    reason: string | null;
}

export interface SwipeCardProfile {
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
    area?: string;
    languages?: string[];
    zodiac?: string;
    lastActive?: string;
    prompts?: { question: string; answer: string }[];
    aiSummary?: string;
    // Extra profile details
    extra?: {
        school?: string;
        work?: string;
        lookingFor?: string[];
        exercise?: string;
        drinking?: string;
        smoking?: string;
        kids?: string;
        religion?: string;
        ethnicity?: string;
        sexuality?: string;
    };
}

export interface Match {
    id: string;
    she_id: string;
    he_id: string;
    score: number;
    post_unlock_rating: {
        she_rating: number;
        he_rating: number;
    };
    is_unlocked: boolean;
    matched_at: string;
}

export interface SwipeResult {
    success: boolean;
    isMatch: boolean;
    match?: Match;
    error?: string;
}

// ============= Helper =============

const toSwipeCardProfile = (rec: RecommendedProfile): SwipeCardProfile => {
    const dob = new Date(rec.profile.dob);
    const age = Math.floor(
        (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );

    // Map extra fields, filtering out empty values
    const extra = rec.profile.extra ? {
        school: rec.profile.extra.school || undefined,
        work: rec.profile.extra.work || undefined,
        lookingFor: rec.profile.extra.looking_for?.length ? rec.profile.extra.looking_for : undefined,
        exercise: rec.profile.extra.excercise || undefined,
        drinking: rec.profile.extra.drinking || undefined,
        smoking: rec.profile.extra.smoking || undefined,
        kids: rec.profile.extra.kids || undefined,
        religion: rec.profile.extra.religion || undefined,
        ethnicity: rec.profile.extra.ethnicity || undefined,
        sexuality: rec.profile.extra.sexuality || undefined,
    } : undefined;

    return {
        id: rec.profile.id,
        firstName: rec.profile.name.split(" ")[0],
        age,
        bio: rec.profile.bio,
        hobbies: rec.profile.hobbies,
        traits: rec.profile.personality_traits.map((t) => t.key),
        photos: rec.profile.photos,
        isRevealed: false,
        isVerified: rec.profile.is_verified,
        matchScore: Math.round(rec.match_score),
        distance: rec.distance_km
            ? rec.distance_km < 1
                ? "< 1 km"
                : `${Math.round(rec.distance_km)} km`
            : "Nearby",
        area: undefined,
        languages: rec.profile.extra?.languages,
        zodiac: rec.profile.extra?.zodiac,
        lastActive: rec.profile.is_online ? "Online" : undefined,
        prompts:
            rec.profile.user_prompts.length > 0
                ? rec.profile.user_prompts.map((p, i) => ({
                    question: `Prompt ${i + 1}`,
                    answer: p,
                }))
                : undefined,
        extra,
    };
};

// ============= Store State =============

interface SwipeState {
    // State
    profiles: SwipeCardProfile[];
    currentIndex: number;
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    error: string | null;
    cursor: string | null;
    hasMore: boolean;
    lastFetched: number | null;
    filter: RecommendationFilter | null;

    // Actions
    fetchRecommendations: (cursor?: string) => Promise<void>;
    setFilter: (filter: RecommendationFilter | null) => void;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    swipe: (
        profileId: string,
        action: SwipeType
    ) => Promise<SwipeResult>;
    advanceIndex: () => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    reset: () => void;
}

// ============= Store =============

export const useSwipeStore = create<SwipeState>((set, get) => ({
    // Initial state
    profiles: [],
    currentIndex: 0,
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    error: null,
    cursor: null,
    hasMore: true,
    lastFetched: null,
    filter: null,

    // Fetch recommendations
    fetchRecommendations: async (cursor?: string) => {
        const { isLoading, isLoadingMore } = get();
        if (isLoading || isLoadingMore) return;

        const isInitialFetch = !cursor;
        set({
            isLoading: isInitialFetch,
            isLoadingMore: !isInitialFetch,
            error: null,
        });

        try {
            const { filter } = get();
            const result = await graphqlClient
                .query(GET_RECOMMENDATIONS, { cursor, limit: 20, filter })
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            const data = result.data?.recommendations;
            const newProfiles = (data?.items || []).map(toSwipeCardProfile);

            set((state) => ({
                profiles: isInitialFetch
                    ? newProfiles
                    : [...state.profiles, ...newProfiles],
                cursor: data?.next_cursor || null,
                hasMore: data?.has_more ?? false,
                isLoading: false,
                isLoadingMore: false,
                lastFetched: Date.now(),
                currentIndex: isInitialFetch ? 0 : state.currentIndex,
            }));
        } catch (error) {
            console.error("Fetch recommendations error:", error);
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to load recommendations",
                isLoading: false,
                isLoadingMore: false,
            });
        }
    },

    // Load more profiles
    loadMore: async () => {
        const { cursor, hasMore, isLoadingMore, profiles, currentIndex } = get();
        const remainingProfiles = profiles.length - currentIndex;

        // Load more when running low (3 or fewer remaining)
        if (remainingProfiles <= 3 && hasMore && !isLoadingMore && cursor) {
            await get().fetchRecommendations(cursor);
        }
    },

    // Refresh (pull-to-refresh)
    refresh: async () => {
        set({
            isRefreshing: true,
            error: null,
            profiles: [],
            currentIndex: 0,
            cursor: null,
            hasMore: true,
        });

        try {
            const { filter } = get();
            const result = await graphqlClient
                .query(
                    GET_RECOMMENDATIONS,
                    { limit: 20, filter },
                    { requestPolicy: "network-only" }
                )
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            const data = result.data?.recommendations;
            const newProfiles = (data?.items || []).map(toSwipeCardProfile);

            set({
                profiles: newProfiles,
                cursor: data?.next_cursor || null,
                hasMore: data?.has_more ?? false,
                isRefreshing: false,
                lastFetched: Date.now(),
            });
        } catch (error) {
            console.error("Refresh recommendations error:", error);
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to refresh recommendations",
                isRefreshing: false,
            });
        }
    },

    // Submit swipe action
    swipe: async (profileId, action) => {
        try {
            const result = await graphqlClient
                .mutation(SWIPE_MUTATION, {
                    target_id: profileId,
                    action_type: action,
                })
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            const swipeResponse = result.data?.swipe;
            const isMatch = swipeResponse?.match !== null;

            // Advance index after successful swipe
            get().advanceIndex();

            // Try to load more if running low
            get().loadMore();

            return {
                success: true,
                isMatch,
                match: swipeResponse?.match,
            };
        } catch (error) {
            console.error("Swipe error:", error);
            return {
                success: false,
                isMatch: false,
                error: error instanceof Error ? error.message : "Failed to swipe",
            };
        }
    },

    // Advance to next profile
    advanceIndex: () => {
        set((state) => ({
            currentIndex: state.currentIndex + 1,
        }));
    },

    // Set error
    setError: (error) => set({ error }),

    // Clear error
    clearError: () => set({ error: null }),

    // Set filter
    setFilter: (filter) => set({ filter }),

    // Reset store
    reset: () =>
        set({
            profiles: [],
            currentIndex: 0,
            isLoading: false,
            isLoadingMore: false,
            isRefreshing: false,
            error: null,
            cursor: null,
            hasMore: true,
            lastFetched: null,
        }),
}));

export default useSwipeStore;
