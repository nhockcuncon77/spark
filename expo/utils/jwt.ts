// JWT utilities for decoding user info from access token
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { config } from "@/constants/config";

// JWT payload structure
export interface JWTPayload {
    uid: string;
    email: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    date_of_birth: string;
    name: string;
    pfp: string;
    exp: number;
    iat: number;
    iss: string;
}

/**
 * Decode a JWT token without verification (client-side only)
 * This just parses the payload - actual verification is done server-side
 */
export function decodeJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            return null;
        }

        // Decode base64url to base64
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

        // Decode base64 to string
        const jsonPayload = atob(base64);

        return JSON.parse(jsonPayload) as JWTPayload;
    } catch (error) {
        console.error("Failed to decode JWT:", error);
        return null;
    }
}

/**
 * Get current user ID from stored JWT
 */
export async function getCurrentUserId(): Promise<string | null> {
    try {
        let token: string | null;

        if (Platform.OS === "web") {
            token = localStorage.getItem(config.ACCESS_TOKEN_KEY);
        } else {
            token = await SecureStore.getItemAsync(config.ACCESS_TOKEN_KEY);
        }

        if (!token) {
            return null;
        }

        const payload = decodeJWT(token);
        return payload?.uid || null;
    } catch (error) {
        console.error("Failed to get current user ID:", error);
        return null;
    }
}

/**
 * Get full user info from stored JWT
 */
export async function getCurrentUserFromJWT(): Promise<JWTPayload | null> {
    try {
        let token: string | null;

        if (Platform.OS === "web") {
            token = localStorage.getItem(config.ACCESS_TOKEN_KEY);
        } else {
            token = await SecureStore.getItemAsync(config.ACCESS_TOKEN_KEY);
        }

        if (!token) {
            return null;
        }

        return decodeJWT(token);
    } catch (error) {
        console.error("Failed to get current user from JWT:", error);
        return null;
    }
}

/**
 * Check if JWT is expired
 */
export function isJWTExpired(payload: JWTPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
}
