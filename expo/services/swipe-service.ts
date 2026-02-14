// Swipe Service - GraphQL queries for recommendations and swipe actions
// Uses swipes.graphqls schema

import { graphqlClient } from "./graphql-client";
import { gql } from "urql";
import { UserPublic } from "./chat-service";

// ============= GraphQL Documents =============

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($cursor: String, $limit: Int) {
    recommendations(cursor: $cursor, limit: $limit) {
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

const GET_MY_SWIPES = gql`
  query GetMySwipes {
    mySwipes {
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
      swipe {
        id
        user_id
        target_id
        action_type
        created_at
      }
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

export interface Swipe {
    id: string;
    user_id: string;
    target_id: string;
    action_type: SwipeType;
    created_at: string;
}

export interface SwipedProfile {
    profile: UserPublic;
    swipe: Swipe;
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

export interface SwipeResponse {
    swipe: Swipe;
    match: Match | null;
}

export interface RecommendedProfile {
    profile: UserPublic;
    match_score: number;
    compatibility_score: number;
    common_interests: string[];
    distance_km: number | null;
    reason: string | null;
}

export interface RecommendationsResult {
    items: RecommendedProfile[];
    next_cursor: string | null;
    has_more: boolean;
    fetched_at: string;
}

// ============= Swipe Service =============

class SwipeService {
    /**
     * Get recommended profiles for swiping
     */
    async getRecommendations(
        cursor?: string,
        limit: number = 20,
    ): Promise<{
        success: boolean;
        data?: RecommendationsResult;
        error?: string;
    }> {
        try {
            const result = await graphqlClient
                .query(GET_RECOMMENDATIONS, { cursor, limit })
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            return {
                success: true,
                data: result.data?.recommendations,
            };
        } catch (error) {
            console.error("Get recommendations error:", error);
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to get recommendations",
            };
        }
    }

    /**
     * Get user's swipe history
     */
    async getMySwipes(): Promise<{
        success: boolean;
        swipes?: SwipedProfile[];
        error?: string;
    }> {
        try {
            const result = await graphqlClient.query(GET_MY_SWIPES, {}).toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            return {
                success: true,
                swipes: result.data?.mySwipes || [],
            };
        } catch (error) {
            console.error("Get swipes error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to get swipes",
            };
        }
    }

    /**
     * Submit a swipe action (like, superlike, or dislike)
     */
    async swipe(
        targetId: string,
        actionType: SwipeType,
    ): Promise<{
        success: boolean;
        data?: SwipeResponse;
        isMatch?: boolean;
        error?: string;
    }> {
        try {
            const result = await graphqlClient
                .mutation(SWIPE_MUTATION, { target_id: targetId, action_type: actionType })
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            const swipeResponse = result.data?.swipe;

            return {
                success: true,
                data: swipeResponse,
                isMatch: swipeResponse?.match !== null,
            };
        } catch (error) {
            console.error("Swipe error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to swipe",
            };
        }
    }

    /**
     * Like a profile
     */
    async like(targetId: string) {
        return this.swipe(targetId, "LIKE");
    }

    /**
     * Superlike a profile
     */
    async superlike(targetId: string) {
        return this.swipe(targetId, "SUPERLIKE");
    }

    /**
     * Dislike (pass) a profile
     */
    async dislike(targetId: string) {
        return this.swipe(targetId, "DISLIKE");
    }
}

export const swipeService = new SwipeService();
export default swipeService;
