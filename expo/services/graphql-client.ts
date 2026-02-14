// GraphQL Client Configuration
// Provides urql client with auth exchange for authenticated requests

import { Client, cacheExchange, fetchExchange, mapExchange } from "urql";
import { authExchange } from "@urql/exchange-auth";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { config } from "@/constants/config";

// API Configuration
const GRAPHQL_URL = config.api_host + "/query";

// Token refresh threshold (refresh if token expires within this many seconds)
const TOKEN_REFRESH_THRESHOLD_SECONDS = 300; // 5 minutes

// ============= In-Memory Token State =============
// This is the CRITICAL fix: maintain an in-memory token reference that can be
// updated immediately after login/logout, without waiting for async storage.
let currentToken: string | null = null;

/**
 * Decode JWT payload without verification (for expiry check only)
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Base64 URL decode
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired or about to expire
 */
function isTokenExpiringSoon(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;

  const expiryTime = payload.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const thresholdMs = TOKEN_REFRESH_THRESHOLD_SECONDS * 1000;

  return expiryTime - now < thresholdMs;
}

/**
 * Get stored access token from secure storage
 */
async function getAccessTokenFromStorage(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(config.ACCESS_TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(config.ACCESS_TOKEN_KEY);
}

/**
 * Store access token securely in persistent storage
 */
export async function setAccessToken(token: string | null): Promise<void> {
  // Update in-memory token immediately
  currentToken = token;

  // Also persist to storage
  if (Platform.OS === "web") {
    if (token) {
      localStorage.setItem(config.ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(config.ACCESS_TOKEN_KEY);
    }
  } else {
    if (token) {
      await SecureStore.setItemAsync(config.ACCESS_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(config.ACCESS_TOKEN_KEY);
    }
  }
}

/**
 * Set GraphQL client token immediately (synchronous in-memory update)
 * Call this AFTER login/signup to ensure subsequent requests use the new token.
 * This is the key function that fixes the auth sync issue.
 */
export function setGraphQLToken(token: string | null): void {
  currentToken = token;
  console.log("[GraphQL] Token updated:", token ? "set" : "cleared");
}

/**
 * Get current in-memory token (fast, synchronous)
 */
export function getGraphQLToken(): string | null {
  return currentToken;
}

/**
 * Clear all auth tokens (both in-memory and storage)
 */
export async function clearAuthTokens(): Promise<void> {
  // Clear in-memory immediately
  currentToken = null;

  // Clear storage
  if (Platform.OS === "web") {
    localStorage.removeItem(config.ACCESS_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(config.ACCESS_TOKEN_KEY);
  }
  console.log("[GraphQL] All tokens cleared");
}

/**
 * Initialize token from storage (call on app start)
 */
export async function initializeToken(): Promise<void> {
  currentToken = await getAccessTokenFromStorage();
  console.log("[GraphQL] Token initialized:", currentToken ? "found" : "none");
}

/**
 * Refresh the access token using current token
 */
async function refreshAccessToken(
  tokenToRefresh: string,
): Promise<string | null> {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenToRefresh}`,
      },
      body: JSON.stringify({
        query: `
          mutation RefreshToken {
            refreshToken {
              access_token
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      console.error("Token refresh failed:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error("Token refresh error:", data.errors);
      return null;
    }

    const newToken = data.data?.refreshToken?.access_token;
    if (newToken) {
      await setAccessToken(newToken);
      return newToken;
    }

    return null;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

/**
 * Create the urql GraphQL client with authentication
 */
export const graphqlClient = new Client({
  url: GRAPHQL_URL,
  exchanges: [
    cacheExchange,
    // Log errors in development
    mapExchange({
      onError(error) {
        console.error("GraphQL Error:", error);
      },
    }),
    // Auth exchange - adds Authorization header and handles token refresh
    authExchange(async (utils) => {
      // Initialize from storage on first load
      if (currentToken === null) {
        currentToken = await getAccessTokenFromStorage();
      }

      return {
        addAuthToOperation(operation) {
          // Use in-memory token for immediate consistency
          if (!currentToken) return operation;
          return utils.appendHeaders(operation, {
            Authorization: `Bearer ${currentToken}`,
          });
        },
        willAuthError() {
          // Check if token is about to expire before making request
          if (!currentToken) return false;
          return isTokenExpiringSoon(currentToken);
        },
        didAuthError(error) {
          // Check if the error is an auth error
          return error.graphQLErrors.some(
            (e) =>
              e.extensions?.code === "UNAUTHENTICATED" ||
              e.message.toLowerCase().includes("unauthorized"),
          );
        },
        async refreshAuth() {
          if (!currentToken) {
            return;
          }

          // Try to refresh the token
          const newToken = await refreshAccessToken(currentToken);

          if (!newToken) {
            // Refresh failed, clear tokens
            await clearAuthTokens();
          }
        },
      };
    }),
    fetchExchange,
  ],
});

export default graphqlClient;
