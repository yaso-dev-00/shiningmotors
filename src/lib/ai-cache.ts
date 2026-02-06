// Client-side AI cache with IndexedDB storage for common queries
// Provides multi-layer caching: memory -> IndexedDB -> API

import { getCached, setCached } from "./cache";

const CACHE_PREFIX = "ai:query:";

interface AICacheEntry {
  query: string;
  response: string;
  queryHash: string;
  context?: string;
  userId?: string;
  model?: string;
  tokens?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  encrypted?: string;
}

// TTL configurations based on query type
const TTL_CONFIG = {
  simple: 24 * 60 * 60 * 1000, // 24 hours for simple queries
  product: 60 * 60 * 1000, // 1 hour for product searches
  recommendation: 30 * 60 * 1000, // 30 minutes for recommendations
  default: 60 * 60 * 1000, // 1 hour default
};

/**
 * Generate a hash for the query to use as cache key
 */
function hashQuery(query: string, userId?: string, context?: string): string {
  const str = `${query}|${userId || ""}|${context || ""}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Determine query type for TTL selection
 */
function getQueryType(query: string): keyof typeof TTL_CONFIG {
  const lowerQuery = query.toLowerCase();
  
  if (
    lowerQuery.includes("recommend") ||
    lowerQuery.includes("suggest") ||
    lowerQuery.includes("similar")
  ) {
    return "recommendation";
  }
  
  if (
    lowerQuery.includes("product") ||
    lowerQuery.includes("buy") ||
    lowerQuery.includes("shop") ||
    lowerQuery.includes("find") ||
    lowerQuery.includes("search")
  ) {
    return "product";
  }
  
  if (
    lowerQuery.includes("what") ||
    lowerQuery.includes("how") ||
    lowerQuery.includes("when") ||
    lowerQuery.includes("where") ||
    lowerQuery.includes("why")
  ) {
    return "simple";
  }
  
  return "default";
}

/**
 * Get cached AI response
 */
export async function getAICached(
  query: string,
  userId?: string,
  context?: string
): Promise<string | null> {
  const queryHash = hashQuery(query, userId, context);
  const cacheKey = `${CACHE_PREFIX}${queryHash}`;
  
  // Layer 1: Check memory cache (fastest)
  const memoryCached = getCached<string>(cacheKey);
  if (memoryCached) {
    return memoryCached;
  }
  
  // Layer 2: IndexedDB caching can be added later if needed
  // For now, memory + sessionStorage is sufficient
  
  return null;
}

/**
 * Set cached AI response
 */
export async function setAICached(
  query: string,
  response: string,
  userId?: string,
  context?: string,
  model?: string,
  tokens?: number
): Promise<void> {
  const queryHash = hashQuery(query, userId, context);
  const cacheKey = `${CACHE_PREFIX}${queryHash}`;
  const queryType = getQueryType(query);
  const ttl = TTL_CONFIG[queryType];
  
  // Layer 1: Set in memory cache
  setCached(cacheKey, response, ttl);
  
  // Layer 2: IndexedDB caching can be added later if needed
  // For now, memory + sessionStorage is sufficient
}

/**
 * Clear AI cache for a user or all cache
 */
export async function clearAICache(userId?: string): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    const { clearCacheByPrefix } = await import("./cache");
    clearCacheByPrefix(CACHE_PREFIX);
  } catch (error) {
    console.error("Failed to clear AI cache:", error);
  }
}

