// Activity Service - GraphQL queries for pokes, views, and superlikes
// Uses profile.activities.graphqls schema

import { graphqlClient } from "./graphql-client";
import { gql } from "urql";
import { UserPublic } from "./chat-service";

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

// ============= Types =============

export type ActivityType = "POKE" | "PROFILE_VIEW" | "SUPERLIKE";
export type ActivityClass = "RECEIVED" | "SENT";

export interface UserProfileActivity {
    id: string;
    type: ActivityType;
    target_user: UserPublic;
    class: ActivityClass;
}

// ============= Activity Service =============

class ActivityService {
    /**
     * Get profile activities (pokes, views, superlikes)
     * @param activityClass - Filter by RECEIVED or SENT
     */
    async getProfileActivities(activityClass?: ActivityClass): Promise<{
        success: boolean;
        activities?: UserProfileActivity[];
        error?: string;
    }> {
        try {
            const result = await graphqlClient
                .query(GET_PROFILE_ACTIVITIES, { class: activityClass })
                .toPromise();

            if (result.error) {
                throw new Error(result.error.message);
            }

            return {
                success: true,
                activities: result.data?.profileActivities || [],
            };
        } catch (error) {
            console.error("Get activities error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to get activities",
            };
        }
    }

    /**
     * Get received activities (pokes/views from others)
     */
    async getReceivedActivities(): Promise<{
        success: boolean;
        activities?: UserProfileActivity[];
        error?: string;
    }> {
        return this.getProfileActivities("RECEIVED");
    }

    /**
     * Get sent activities (pokes/views you sent)
     */
    async getSentActivities(): Promise<{
        success: boolean;
        activities?: UserProfileActivity[];
        error?: string;
    }> {
        return this.getProfileActivities("SENT");
    }

    /**
     * Filter activities by type
     */
    filterByType(
        activities: UserProfileActivity[],
        type: ActivityType,
    ): UserProfileActivity[] {
        return activities.filter((a) => a.type === type);
    }

    /**
     * Create a new activity (poke, view, or superlike)
     */
    async createActivity(
        type: ActivityType,
        targetUserId: string,
    ): Promise<{
        success: boolean;
        activity?: UserProfileActivity;
        error?: string;
    }> {
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

            return {
                success: true,
                activity: result.data?.createProfileActivity,
            };
        } catch (error) {
            console.error("Create activity error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create activity",
            };
        }
    }

    /**
     * Send a poke to a user
     */
    async pokeUser(userId: string): Promise<{
        success: boolean;
        activity?: UserProfileActivity;
        error?: string;
    }> {
        return this.createActivity("POKE", userId);
    }

    /**
     * Record a profile view
     */
    async viewProfile(userId: string): Promise<{
        success: boolean;
        activity?: UserProfileActivity;
        error?: string;
    }> {
        return this.createActivity("PROFILE_VIEW", userId);
    }

    /**
     * Send a superlike to a user
     */
    async superlikeUser(userId: string): Promise<{
        success: boolean;
        activity?: UserProfileActivity;
        error?: string;
    }> {
        return this.createActivity("SUPERLIKE", userId);
    }
}

export const activityService = new ActivityService();
export default activityService;
