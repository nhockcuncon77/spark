// Shared types for Zustand stores

/**
 * Standard async state pattern for stores
 */
export interface AsyncState<T> {
    data: T;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    lastFetched: number | null;
}

/**
 * Pagination state
 */
export interface PaginationState {
    cursor: string | null;
    hasMore: boolean;
}

/**
 * Create initial async state
 */
export function createAsyncState<T>(initialData: T): AsyncState<T> {
    return {
        data: initialData,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastFetched: null,
    };
}

/**
 * Stale time for cache (5 minutes)
 */
export const STALE_TIME = 5 * 60 * 1000;

/**
 * Check if data is stale and should be refetched
 */
export function isStale(lastFetched: number | null, staleTime = STALE_TIME): boolean {
    if (!lastFetched) return true;
    return Date.now() - lastFetched > staleTime;
}
