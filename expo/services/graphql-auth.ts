// GraphQL Authentication Service
// Provides auth methods using GraphQL mutations from users.graphqls

import {
  graphqlClient,
  setAccessToken,
  clearAuthTokens,
} from "./graphql-client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { gql } from "urql";

// Storage keys
const USER_KEY = "spark_user";

// ============= GraphQL Documents =============

const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      access_token
      user {
        id
        first_name
        last_name
        email
        dob
        gender
        pfp
        bio
        hobbies
        interests
        user_prompts
        personality_traits {
          key
          value
        }
        photos
        is_verified
        address {
          city
          state
          country
          coordinates
        }
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
        created_at
        updated_at
      }
    }
  }
`;

const LOGIN_WITH_PASSWORD_MUTATION = gql`
  mutation LoginWithPassword($email: String!, $password: String!) {
    loginWithPassword(email: $email, password: $password) {
      access_token
      user {
        id
        first_name
        last_name
        email
        dob
        gender
        pfp
        bio
        hobbies
        interests
        user_prompts
        personality_traits {
          key
          value
        }
        photos
        is_verified
        address {
          city
          state
          country
          coordinates
        }
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
        created_at
        updated_at
      }
    }
  }
`;

const REQUEST_EMAIL_LOGIN_CODE_MUTATION = gql`
  mutation RequestEmailLoginCode($email: String!) {
    requestEmailLoginCode(email: $email)
  }
`;

const VERIFY_EMAIL_LOGIN_CODE_MUTATION = gql`
  mutation VerifyEmailLoginCode($email: String!, $code: String!) {
    verifyEmailLoginCode(email: $email, code: $code) {
      access_token
      user {
        id
        first_name
        last_name
        email
        dob
        pfp
        gender
        bio
        hobbies
        interests
        user_prompts
        personality_traits {
          key
          value
        }
        photos
        is_verified
        address {
          city
          state
          country
          coordinates
        }
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
        created_at
        updated_at
      }
    }
  }
`;

const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      access_token
      user {
        id
        first_name
        last_name
        email
        dob
        pfp
        gender
        bio
        hobbies
        interests
        user_prompts
        personality_traits {
          key
          value
        }
        photos
        is_verified
        address {
          city
          state
          country
          coordinates
        }
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
        created_at
        updated_at
      }
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      first_name
      last_name
      email
      dob
      pfp
      gender
      bio
      hobbies
      interests
      user_prompts
      personality_traits {
        key
        value
      }
      photos
      is_verified
      address {
        city
        state
        country
        coordinates
      }
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
      created_at
      updated_at
    }
  }
`;

const UPDATE_ME_MUTATION = gql`
  mutation UpdateMe($input: UpdateUserInput!) {
    updateMe(input: $input) {
      id
      first_name
      last_name
      email
      dob
      pfp
      gender
      bio
      hobbies
      interests
      user_prompts
      personality_traits {
        key
        value
      }
      photos
      is_verified
      address {
        city
        state
        country
        coordinates
      }
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
      created_at
      updated_at
    }
  }
`;

// ============= Verification =============

const CREATE_VERIFICATION_MUTATION = gql`
  mutation CreateVerification($input: UserVerificationInput!) {
    createVerification(input: $input) {
      id
      user_id
      status
      created_at
    }
  }
`;

const GET_VERIFICATION_STATUS_QUERY = gql`
  query GetUserVerificationStatus {
    getUserVerificationStatus {
      id
      status
      created_at
      updated_at
    }
  }
`;

// ============= Account Deletion =============

const REQUEST_ACCOUNT_DELETION_MUTATION = gql`
  mutation RequestAccountDeletion {
    requestAccountDeletion
  }
`;

const DELETE_ACCOUNT_MUTATION = gql`
  mutation DeleteAccount($confirmationCode: String!) {
    deleteAccount(confirmationCode: $confirmationCode)
  }
`;

// ============= User Blocking =============

const BLOCK_USER_MUTATION = gql`
  mutation BlockUser($userId: String!) {
    blockUser(userId: $userId)
  }
`;

const UNBLOCK_USER_MUTATION = gql`
  mutation UnblockUser($userId: String!) {
    unblockUser(userId: $userId)
  }
`;

const IS_USER_BLOCKED_QUERY = gql`
  query IsUserBlocked($userId: String!) {
    isUserBlocked(userId: $userId)
  }
`;

// ============= Types =============

export interface CreateUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  dob: string; // ISO date string
  gender?: string;
  pfp?: string;
  bio?: string;
  hobbies?: string[];
  interests?: string[];
  user_prompts?: string[];
  photos?: string[];
  address?: {
    city: string;
    state: string;
    country: string;
  };
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  dob?: string;
  pfp?: string;
  bio?: string;
  gender?: string;
  hobbies?: string[];
  interests?: string[];
  user_prompts?: string[];
  personality_traits?: { key: string; value: number }[];
  photos?: string[];
  is_verified?: boolean;
  address?: {
    city: string;
    state: string;
    country: string;
  };
}

export interface GraphQLUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  dob?: string;
  pfp?: string;
  bio?: string;
  gender?: string;
  hobbies: string[];
  interests: string[];
  user_prompts: string[];
  personality_traits: { key: string; value: number }[];
  photos: string[];
  is_verified: boolean;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: number[];
  };
  extra?: {
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
  };
  created_at?: string;
  updated_at?: string;
}

export interface AuthPayload {
  access_token: string;
  user: GraphQLUser;
}

export interface AuthResult {
  success: boolean;
  user?: GraphQLUser;
  accessToken?: string;
  error?: string;
}

// ============= Helper Functions =============

async function storeUser(user: GraphQLUser): Promise<void> {
  const userJson = JSON.stringify(user);
  if (Platform.OS === "web") {
    localStorage.setItem(USER_KEY, userJson);
  } else {
    await SecureStore.setItemAsync(USER_KEY, userJson);
  }
}

async function getStoredUser(): Promise<GraphQLUser | null> {
  try {
    let userJson: string | null;
    if (Platform.OS === "web") {
      userJson = localStorage.getItem(USER_KEY);
    } else {
      userJson = await SecureStore.getItemAsync(USER_KEY);
    }
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  } catch {
    return null;
  }
}

async function clearStoredUser(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(USER_KEY);
  } else {
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}

function handleAuthPayload(payload: AuthPayload): AuthResult {
  return {
    success: true,
    user: payload.user,
    accessToken: payload.access_token,
  };
}

function handleError(error: unknown): AuthResult {
  console.error("GraphQL Auth Error:", error);
  const message =
    error instanceof Error ? error.message : "An unknown error occurred";
  return {
    success: false,
    error: message,
  };
}

// ============= Auth Service =============

class GraphQLAuthService {
  /**
   * Create a new user account
   */
  async createUser(input: CreateUserInput): Promise<AuthResult> {
    try {
      const result = await graphqlClient
        .mutation(CREATE_USER_MUTATION, { input })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      const payload: AuthPayload = result.data.createUser;

      // Store token and user
      await setAccessToken(payload.access_token);
      await storeUser(payload.user);

      return handleAuthPayload(payload);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Login with email and password
   */
  async loginWithPassword(
    email: string,
    password: string,
  ): Promise<AuthResult> {
    try {
      const result = await graphqlClient
        .mutation(LOGIN_WITH_PASSWORD_MUTATION, { email, password })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      const payload: AuthPayload = result.data.loginWithPassword;

      // Store token and user
      await setAccessToken(payload.access_token);
      await storeUser(payload.user);

      return handleAuthPayload(payload);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Request an email login code (OTP)
   */
  async requestEmailLoginCode(
    email: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await graphqlClient
        .mutation(REQUEST_EMAIL_LOGIN_CODE_MUTATION, { email })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: result.data.requestEmailLoginCode };
    } catch (error) {
      console.error("Request Email Code Error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to send code";
      return { success: false, error: message };
    }
  }

  /**
   * Verify email login code and get auth tokens
   */
  async verifyEmailLoginCode(email: string, code: string): Promise<AuthResult> {
    try {
      const result = await graphqlClient
        .mutation(VERIFY_EMAIL_LOGIN_CODE_MUTATION, { email, code })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      const payload: AuthPayload = result.data.verifyEmailLoginCode;

      // Store token and user
      await setAccessToken(payload.access_token);
      await storeUser(payload.user);

      return handleAuthPayload(payload);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<AuthResult> {
    try {
      const result = await graphqlClient
        .mutation(REFRESH_TOKEN_MUTATION, {})
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      const payload: AuthPayload = result.data.refreshToken;

      // Store new token and user
      await setAccessToken(payload.access_token);
      await storeUser(payload.user);

      return handleAuthPayload(payload);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Get the current authenticated user
   */
  async getMe(): Promise<AuthResult> {
    try {
      const result = await graphqlClient.query(ME_QUERY, {}).toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (!result.data.me) {
        return {
          success: false,
          error: "User not found",
        };
      }

      return {
        success: true,
        user: result.data.me,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Restore session from stored credentials
   * On web, initializes token from localStorage first (e.g. after login on landing).
   */
  async restoreSession(): Promise<AuthResult> {
    try {
      if (Platform.OS === "web") {
        await initializeToken();
      }
      // On web we may have only token (e.g. from landing login); still try getMe
      const storedUser = await getStoredUser();
      if (!storedUser && Platform.OS !== "web") {
        return {
          success: false,
          error: "No stored session",
        };
      }

      // Validate the session by fetching current user (token from storage on web)
      const meResult = await this.getMe();

      if (meResult.success && meResult.user) {
        // Update stored user with fresh data
        await storeUser(meResult.user);
        return meResult;
      }

      // If fetching user failed, try to refresh token
      const refreshResult = await this.refreshToken();

      if (refreshResult.success) {
        return refreshResult;
      }

      // Session is invalid, clear stored data
      await this.signOut();
      return {
        success: false,
        error: "Session expired",
      };
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Update the current user's profile
   */
  async updateMe(input: UpdateUserInput): Promise<AuthResult> {
    try {
      const result = await graphqlClient
        .mutation(UPDATE_ME_MUTATION, { input })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      const user: GraphQLUser = result.data.updateMe;

      // Update stored user
      await storeUser(user);

      return {
        success: true,
        user,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Check what onboarding steps are needed based on user profile
   */
  getOnboardingStatus(user: GraphQLUser): {
    needsHobbies: boolean;
    needsInterests: boolean;
    needsPersonality: boolean;
    needsPhotos: boolean;
    needsPrompts: boolean;
    isComplete: boolean;
    nextScreen: string | null;
  } {
    const needsHobbies = !user.hobbies || user.hobbies.length === 0;
    const needsInterests = !user.interests || user.interests.length === 0;
    const needsPersonality =
      !user.personality_traits || user.personality_traits.length === 0;
    const needsPhotos = !user.photos || user.photos.length === 0;
    const needsPrompts = !user.user_prompts || user.user_prompts.length === 0;

    const isComplete =
      !needsHobbies &&
      !needsInterests &&
      !needsPersonality &&
      !needsPhotos &&
      !needsPrompts;

    // Determine next screen based on what's missing
    let nextScreen: string | null = null;
    if (needsHobbies) {
      nextScreen = "/(auth)/hobbies";
    } else if (needsPersonality) {
      nextScreen = "/(auth)/personality";
    } else if (needsPhotos) {
      nextScreen = "/(auth)/photos";
    }

    return {
      needsHobbies,
      needsInterests,
      needsPersonality,
      needsPhotos,
      needsPrompts,
      isComplete,
      nextScreen,
    };
  }

  /**
   * Sign out and clear stored credentials
   */
  async signOut(): Promise<void> {
    await clearAuthTokens();
    await clearStoredUser();
  }

  /**
   * Get stored user without making API call
   */
  async getStoredUser(): Promise<GraphQLUser | null> {
    return getStoredUser();
  }

  /**
   * Create a verification request
   * MediaInput requires: id, url, type (IMAGE|VIDEO|AUDIO|FILE), created_at
   */
  async createVerification(photoUri: string): Promise<{ success: boolean; verificationId?: string; error?: string }> {
    try {
      // Build media array with all required fields
      const media = [{
        id: `verification_${Date.now()}`,
        url: photoUri,
        type: "IMAGE" as const,
        created_at: new Date().toISOString(),
      }];

      const result = await graphqlClient
        .mutation(CREATE_VERIFICATION_MUTATION, { input: { media } })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        success: true,
        verificationId: result.data.createVerification.id,
      };
    } catch (error) {
      console.error("Create Verification Error:", error);
      const message = error instanceof Error ? error.message : "Failed to create verification";
      return { success: false, error: message };
    }
  }

  /**
   * Get verification status for the current user
   */
  async getVerificationStatus(): Promise<{ success: boolean; status?: string; verificationId?: string; error?: string }> {
    try {
      const result = await graphqlClient
        .query(GET_VERIFICATION_STATUS_QUERY, {})
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      const data = result.data?.getUserVerificationStatus;
      if (!data) {
        return { success: false, error: "No verification found" };
      }

      return {
        success: true,
        status: data.status,
        verificationId: data.id,
      };
    } catch (error) {
      console.error("Get Verification Status Error:", error);
      const message = error instanceof Error ? error.message : "Failed to get status";
      return { success: false, error: message };
    }
  }

  /**
   * Request account deletion - sends confirmation code to user's email
   */
  async requestAccountDeletion(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await graphqlClient
        .mutation(REQUEST_ACCOUNT_DELETION_MUTATION, {})
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: result.data.requestAccountDeletion };
    } catch (error) {
      console.error("Request Account Deletion Error:", error);
      const message = error instanceof Error ? error.message : "Failed to request deletion";
      return { success: false, error: message };
    }
  }

  /**
   * Delete account with confirmation code
   */
  async deleteAccount(confirmationCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await graphqlClient
        .mutation(DELETE_ACCOUNT_MUTATION, { confirmationCode })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data.deleteAccount) {
        // Clear all stored data
        await this.signOut();
      }

      return { success: result.data.deleteAccount };
    } catch (error) {
      console.error("Delete Account Error:", error);
      const message = error instanceof Error ? error.message : "Failed to delete account";
      return { success: false, error: message };
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await graphqlClient
        .mutation(BLOCK_USER_MUTATION, { userId })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: result.data.blockUser };
    } catch (error) {
      console.error("Block User Error:", error);
      const message = error instanceof Error ? error.message : "Failed to block user";
      return { success: false, error: message };
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await graphqlClient
        .mutation(UNBLOCK_USER_MUTATION, { userId })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: result.data.unblockUser };
    } catch (error) {
      console.error("Unblock User Error:", error);
      const message = error instanceof Error ? error.message : "Failed to unblock user";
      return { success: false, error: message };
    }
  }

  /**
   * Check if a user is blocked
   */
  async isUserBlocked(userId: string): Promise<{ success: boolean; isBlocked?: boolean; error?: string }> {
    try {
      const result = await graphqlClient
        .query(IS_USER_BLOCKED_QUERY, { userId })
        .toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: true, isBlocked: result.data.isUserBlocked };
    } catch (error) {
      console.error("Is User Blocked Error:", error);
      const message = error instanceof Error ? error.message : "Failed to check blocked status";
      return { success: false, error: message };
    }
  }
}

export const graphqlAuthService = new GraphQLAuthService();
export default graphqlAuthService;
