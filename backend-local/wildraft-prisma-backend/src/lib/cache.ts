import { LRUCache } from 'lru-cache';
import { AccessRole } from '@prisma/client';

// Cache TTL in milliseconds (15 minutes - permissions rarely change)
const CACHE_TTL = 15 * 60 * 1000;

// Max entries to prevent memory bloat
const MAX_ENTRIES = 10000;

// Sentinel value for "no access" (since LRU cache doesn't allow null)
export const NO_ACCESS = 'NO_ACCESS' as const;
export type CachedAccess = AccessRole | typeof NO_ACCESS;

/**
 * Cache for user existence checks
 * Key: userId (number)
 * Value: true (user exists)
 */
export const userExistsCache = new LRUCache<number, boolean>({
  max: MAX_ENTRIES,
  ttl: CACHE_TTL,
});

/**
 * Cache for library access checks
 * Key: "userId:libraryId"
 * Value: AccessRole or NO_ACCESS sentinel
 */
export const libraryAccessCache = new LRUCache<string, CachedAccess>({
  max: MAX_ENTRIES,
  ttl: CACHE_TTL,
});

/**
 * Generate cache key for library access
 */
export function getAccessCacheKey(userId: number, libraryId: number): string {
  return `${userId}:${libraryId}`;
}

/**
 * Invalidate library access cache for a specific user and library
 */
export function invalidateLibraryAccess(userId: number, libraryId: number): void {
  const key = getAccessCacheKey(userId, libraryId);
  libraryAccessCache.delete(key);
}

/**
 * Invalidate all library access cache entries for a library
 * Used when bulk changes happen (e.g., library deletion)
 */
export function invalidateAllLibraryAccess(libraryId: number): void {
  // Iterate and delete matching keys
  for (const key of libraryAccessCache.keys()) {
    if (key.endsWith(`:${libraryId}`)) {
      libraryAccessCache.delete(key);
    }
  }
}

/**
 * Invalidate all cache entries for a user
 * Used when user is deleted
 */
export function invalidateUserCache(userId: number): void {
  userExistsCache.delete(userId);
  
  // Remove all access entries for this user
  for (const key of libraryAccessCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      libraryAccessCache.delete(key);
    }
  }
}

/**
 * Clear all caches (useful for testing)
 */
export function clearAllCaches(): void {
  userExistsCache.clear();
  libraryAccessCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    userExists: {
      size: userExistsCache.size,
      max: MAX_ENTRIES,
    },
    libraryAccess: {
      size: libraryAccessCache.size,
      max: MAX_ENTRIES,
    },
    ttlMs: CACHE_TTL,
  };
}

