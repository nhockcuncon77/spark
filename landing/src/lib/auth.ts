/**
 * Simple auth for the landing + app.
 * Single source of truth: localStorage (spark_access_token, spark_user).
 * No persist middleware, no separate app state — just read/write here.
 */

const TOKEN_KEY = "spark_access_token";
const USER_KEY = "spark_user";

export type StoredUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  [key: string]: unknown;
};

export function getAuth(): { token: string; user: StoredUser } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  if (!token || !userJson) return null;
  try {
    const user = JSON.parse(userJson) as StoredUser;
    if (!user?.id || !user?.email) return null;
    return { token, user };
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function hasAuth(): boolean {
  return getAuth() !== null;
}
