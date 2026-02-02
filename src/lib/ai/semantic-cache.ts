// Semantic cache using embeddings to find similar queries
// Reuses responses for semantically similar queries

interface CachedResponse {
  query: string;
  response: string;
  embedding?: number[]; // Vector embedding
  queryHash: string;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

const SIMILARITY_THRESHOLD = 0.85; // 85% similarity to reuse response
const MAX_CACHE_SIZE = 1000; // Maximum cached responses

class SemanticCache {
  private cache: Map<string, CachedResponse> = new Map();

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find similar cached response
   */
  findSimilar(
    queryEmbedding: number[],
    minSimilarity: number = SIMILARITY_THRESHOLD
  ): CachedResponse | null {
    const now = Date.now();
    let bestMatch: CachedResponse | null = null;
    let bestSimilarity = minSimilarity;

    // Clean expired entries
    this.cleanExpired(now);

    // Find best matching cached response
    for (const cached of this.cache.values()) {
      if (cached.expiresAt <= now) continue;
      if (!cached.embedding) continue;

      const similarity = this.cosineSimilarity(
        queryEmbedding,
        cached.embedding
      );

      if (similarity >= bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = cached;
      }
    }

    if (bestMatch) {
      bestMatch.hitCount++;
      return bestMatch;
    }

    return null;
  }

  /**
   * Store response with embedding
   */
  store(
    query: string,
    response: string,
    embedding: number[],
    queryHash: string,
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): void {
    // Clean if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictLeastUsed();
    }

    const now = Date.now();
    const cached: CachedResponse = {
      query,
      response,
      embedding,
      queryHash,
      createdAt: now,
      expiresAt: now + ttl,
      hitCount: 0,
    };

    this.cache.set(queryHash, cached);
  }

  /**
   * Get cached response by hash
   */
  get(queryHash: string): CachedResponse | null {
    const cached = this.cache.get(queryHash);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
      this.cache.delete(queryHash);
      return null;
    }

    cached.hitCount++;
    return cached;
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(now: number = Date.now()): void {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict least used entries (LRU-like)
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].hitCount - b[1].hitCount);

    // Remove bottom 10%
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    totalHits: number;
    avgHits: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
    const avgHits = entries.length > 0 ? totalHits / entries.length : 0;

    return {
      size: this.cache.size,
      totalHits,
      avgHits,
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
let semanticCacheInstance: SemanticCache | null = null;

/**
 * Get semantic cache instance
 */
export function getSemanticCache(): SemanticCache {
  if (!semanticCacheInstance) {
    semanticCacheInstance = new SemanticCache();
  }
  return semanticCacheInstance;
}

/**
 * Find similar cached response using embedding
 */
export function findSimilarCached(
  queryEmbedding: number[],
  minSimilarity?: number
): CachedResponse | null {
  return getSemanticCache().findSimilar(queryEmbedding, minSimilarity);
}

/**
 * Store response with embedding
 */
export function storeSemanticCache(
  query: string,
  response: string,
  embedding: number[],
  queryHash: string,
  ttl?: number
): void {
  getSemanticCache().store(query, response, embedding, queryHash, ttl);
}

/**
 * Get cached response by hash
 */
export function getSemanticCached(queryHash: string): CachedResponse | null {
  return getSemanticCache().get(queryHash);
}


