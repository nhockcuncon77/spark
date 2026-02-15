/**
 * GraphQL auth API for the landing site (login/register).
 * Set VITE_API_URL to your backend base URL (overrides default).
 * GraphQL endpoint is ${API_BASE}/query
 */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://spark-c6bk.onrender.com";
const GRAPHQL_URL = API_BASE ? `${API_BASE.replace(/\/$/, "")}/query` : "";

/** Abort request after this ms (avoids hanging forever on cold start or network issues) */
const REQUEST_TIMEOUT_MS = 60_000;

export type AuthUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  dob: string | null;
  gender: string | null;
  pfp: string | null;
  bio: string | null;
  hobbies: string[];
  is_verified: boolean;
  personality_traits?: { key: string; value: number }[];
  photos?: string[];
};

export type AuthPayload = {
  access_token: string;
  user: AuthUser;
};

export type LoginResult = { success: true; payload: AuthPayload } | { success: false; error: string };
export type RegisterResult = { success: true; payload: AuthPayload } | { success: false; error: string };

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!GRAPHQL_URL) {
    throw new Error("VITE_API_URL is not set. Please set it in your .env (e.g. VITE_API_URL=https://your-backend.onrender.com)");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    const json = await res.json();
    if (json.errors?.length) {
      const msg = json.errors[0]?.message ?? "GraphQL error";
      throw new Error(msg);
    }
    return json.data as T;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error) {
      if (e.name === "AbortError") {
        throw new Error("Request timed out. The server may be starting up—please try again in a moment.");
      }
      throw e;
    }
    throw e;
  }
}

const LOGIN_MUTATION = `
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
        is_verified
        personality_traits { key value }
        photos
      }
    }
  }
`;

const CREATE_USER_MUTATION = `
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
        is_verified
        personality_traits { key value }
        photos
      }
    }
  }
`;

export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  try {
    const data = await graphql<{ loginWithPassword: AuthPayload }>(LOGIN_MUTATION, { email, password });
    const payload = data?.loginWithPassword;
    if (!payload?.access_token || !payload?.user) {
      return { success: false, error: "Invalid response from server" };
    }
    return { success: true, payload };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed";
    return { success: false, error: message };
  }
}

export async function register(input: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  dob: string; // ISO date
  gender: string;
}): Promise<RegisterResult> {
  try {
    const data = await graphql<{ createUser: AuthPayload }>(CREATE_USER_MUTATION, {
      input: {
        email: input.email,
        password: input.password,
        first_name: input.first_name,
        last_name: input.last_name,
        dob: input.dob,
        gender: input.gender,
      },
    });
    const payload = data?.createUser;
    if (!payload?.access_token || !payload?.user) {
      return { success: false, error: "Invalid response from server" };
    }
    return { success: true, payload };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed";
    return { success: false, error: message };
  }
}

const SPARK_ACCESS_TOKEN_KEY = "spark_access_token";
const SPARK_USER_KEY = "spark_user";

/** Persist auth so the Expo web app at /app can read it (localStorage). */
export function persistAuth(payload: AuthPayload): void {
  const userProfile = {
    id: payload.user.id,
    email: payload.user.email,
    firstName: payload.user.first_name,
    lastName: payload.user.last_name,
    bio: payload.user.bio ?? "",
    hobbies: payload.user.hobbies ?? [],
    personalityTraits: (payload.user.personality_traits ?? []).reduce(
      (acc, t) => ({ ...acc, [t.key]: t.value }),
      {} as Record<string, number>,
    ),
    photos: payload.user.photos ?? [],
    isVerified: payload.user.is_verified,
    isPhotosRevealed: false,
  };
  try {
    localStorage.setItem(SPARK_ACCESS_TOKEN_KEY, payload.access_token);
    localStorage.setItem(SPARK_USER_KEY, JSON.stringify(userProfile));
  } catch {
    // ignore
  }
}

/** Base URL for the web app after login (Expo web at /app or VITE_SPARK_APP_URL). */
export function getAppUrl(): string {
  const base = import.meta.env.VITE_SPARK_APP_URL;
  if (base && base !== "/app/") {
    return base.startsWith("http") ? base : `${window.location.origin}${base.startsWith("/") ? "" : "/"}${base}`;
  }
  return `${window.location.origin}/app/`;
}
