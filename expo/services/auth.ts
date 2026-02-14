// WorkOS Authentication Service for Expo
// Following the WorkOS + Expo integration guide

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Ensure web browser auth sessions are properly handled
WebBrowser.maybeCompleteAuthSession();

// Environment variables - these should be set in your .env or app.config.js
const WORKOS_CLIENT_ID = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID || "";
const WORKOS_API_KEY = process.env.EXPO_PUBLIC_WORKOS_API_KEY || "";
const WORKOS_CONNECTION_ID = process.env.EXPO_PUBLIC_WORKOS_CONNECTION_ID || "";

// Storage keys
const TOKEN_KEY = "spark_auth_token";
const USER_KEY = "spark_user";
const REFRESH_TOKEN_KEY = "spark_refresh_token";

export interface WorkOSUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  connectionId: string;
  connectionType: string;
  idpId: string;
  rawAttributes: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthResult {
  success: boolean;
  user?: WorkOSUser;
  tokens?: AuthTokens;
  error?: string;
}

class AuthService {
  private redirectUri: string;

  constructor() {
    // Generate the redirect URI for the app
    // This needs to be added to the WorkOS Dashboard allowlist
    this.redirectUri = AuthSession.makeRedirectUri({
      scheme: "spark",
      path: "auth/callback",
    });
  }

  /**
   * Get the redirect URI to add to WorkOS Dashboard
   */
  getRedirectUri(): string {
    return this.redirectUri;
  }

  /**
   * Initiate the SSO authentication flow
   * Opens the browser for user authentication
   */
  async signInWithSSO(connectionId?: string): Promise<AuthResult> {
    try {
      const connection = connectionId || WORKOS_CONNECTION_ID;

      if (!WORKOS_CLIENT_ID) {
        throw new Error("WorkOS Client ID not configured");
      }

      // Build the authorization URL
      const authUrl = this.buildAuthorizationUrl(connection);

      // Open the browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        this.redirectUri,
      );

      if (result.type !== "success") {
        return {
          success: false,
          error:
            result.type === "cancel"
              ? "Authentication cancelled"
              : "Authentication failed",
        };
      }

      // Extract the authorization code from the callback URL
      const code = this.extractCodeFromUrl(result.url);

      if (!code) {
        return {
          success: false,
          error: "No authorization code received",
        };
      }

      // Exchange the code for tokens and user profile
      return await this.exchangeCodeForTokens(code);
    } catch (error) {
      console.error("SSO Sign In Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Build the WorkOS authorization URL
   */
  private buildAuthorizationUrl(connectionId: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: WORKOS_CLIENT_ID,
      redirect_uri: this.redirectUri,
      state: this.generateState(),
      connection: connectionId,
    });

    console.log(`https://api.workos.com/sso/authorize?${params.toString()}`);

    return `https://api.workos.com/sso/authorize?${params.toString()}`;
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  /**
   * Extract the authorization code from the callback URL
   */
  private extractCodeFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("code");
    } catch {
      // Fallback to regex extraction
      const codeRegex = /code=([^&]+)/;
      const matches = url.match(codeRegex);
      return matches ? matches[1] : null;
    }
  }

  /**
   * Exchange the authorization code for access token and user profile
   * Note: In production, this should be done on your backend server
   * to avoid exposing the client secret
   */
  private async exchangeCodeForTokens(code: string): Promise<AuthResult> {
    try {
      const response = await fetch("https://api.workos.com/sso/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: WORKOS_CLIENT_ID,
          client_secret: WORKOS_API_KEY,
          grant_type: "authorization_code",
          code: code,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${errorData}`);
      }

      const data = await response.json();

      // Parse the profile from the response
      const user: WorkOSUser = {
        id: data.profile.id,
        email: data.profile.email,
        firstName: data.profile.first_name || "",
        lastName: data.profile.last_name || "",
        profilePictureUrl: data.profile.profile_picture_url,
        connectionId: data.profile.connection_id,
        connectionType: data.profile.connection_type,
        idpId: data.profile.idp_id,
        rawAttributes: data.profile.raw_attributes || {},
      };

      const tokens: AuthTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };

      // Store tokens and user securely
      await this.storeAuthData(tokens, user);

      return {
        success: true,
        user,
        tokens,
      };
    } catch (error) {
      console.error("Token Exchange Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token exchange failed",
      };
    }
  }

  /**
   * Store authentication data securely
   */
  private async storeAuthData(
    tokens: AuthTokens,
    user: WorkOSUser,
  ): Promise<void> {
    if (Platform.OS === "web") {
      // Use localStorage for web (less secure, but works)
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (tokens.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    } else {
      // Use SecureStore for native platforms
      await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      if (tokens.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    }
  }

  /**
   * Get the stored access token
   */
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }

  /**
   * Get the stored user profile
   */
  async getStoredUser(): Promise<WorkOSUser | null> {
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

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  /**
   * Sign out the user
   */
  async signOut(): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Restore session on app launch
   * Returns the user if already authenticated
   */
  async restoreSession(): Promise<AuthResult> {
    try {
      const [token, user] = await Promise.all([
        this.getAccessToken(),
        this.getStoredUser(),
      ]);

      if (token && user) {
        return {
          success: true,
          user,
          tokens: { accessToken: token },
        };
      }

      return {
        success: false,
        error: "No session found",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to restore session",
      };
    }
  }
}

export const authService = new AuthService();
export default authService;
