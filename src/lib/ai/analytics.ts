// Analytics tracking for AI usage, costs, and performance

interface AnalyticsEvent {
  type: "api_call" | "cache_hit" | "cache_miss" | "error" | "rule_match";
  timestamp: number;
  userId?: string;
  query?: string;
  model?: string;
  tokens?: number;
  cost?: number;
  responseTime?: number;
  cacheType?: "client" | "server" | "precomputed";
  error?: string;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory
  private flushInterval = 60000; // Flush to server every minute

  /**
   * Track an event
   */
  track(event: Omit<AnalyticsEvent, "timestamp">): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.events.push(fullEvent);

    // Keep only last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Flush to server periodically (in production)
    if (typeof window !== "undefined" && this.events.length % 10 === 0) {
      this.flushToServer();
    }
  }

  /**
   * Track API call
   */
  trackAPICall(
    model: string,
    tokens: number,
    cost: number,
    responseTime: number,
    userId?: string,
    query?: string
  ): void {
    this.track({
      type: "api_call",
      model,
      tokens,
      cost,
      responseTime,
      userId,
      query,
    });
  }

  /**
   * Track cache hit
   */
  trackCacheHit(
    cacheType: "client" | "server" | "precomputed",
    responseTime: number,
    userId?: string
  ): void {
    this.track({
      type: "cache_hit",
      cacheType,
      responseTime,
      userId,
    });
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(userId?: string, query?: string): void {
    this.track({
      type: "cache_miss",
      userId,
      query,
    });
  }

  /**
   * Track rule-based response
   */
  trackRuleMatch(responseTime: number, userId?: string): void {
    this.track({
      type: "rule_match",
      responseTime,
      userId,
    });
  }

  /**
   * Track error
   */
  trackError(error: string, userId?: string, query?: string): void {
    this.track({
      type: "error",
      error,
      userId,
      query,
    });
  }

  /**
   * Get statistics
   */
  getStats(timeWindowMs: number = 3600000): {
    totalEvents: number;
    apiCalls: number;
    cacheHits: number;
    cacheMisses: number;
    ruleMatches: number;
    errors: number;
    totalCost: number;
    totalTokens: number;
    avgResponseTime: number;
    cacheHitRate: number;
  } {
    const now = Date.now();
    const windowStart = now - timeWindowMs;
    const recentEvents = this.events.filter(
      (e) => e.timestamp >= windowStart
    );

    const apiCalls = recentEvents.filter((e) => e.type === "api_call");
    const cacheHits = recentEvents.filter((e) => e.type === "cache_hit");
    const cacheMisses = recentEvents.filter((e) => e.type === "cache_miss");
    const ruleMatches = recentEvents.filter((e) => e.type === "rule_match");
    const errors = recentEvents.filter((e) => e.type === "error");

    const totalCost = apiCalls.reduce((sum, e) => sum + (e.cost || 0), 0);
    const totalTokens = apiCalls.reduce((sum, e) => sum + (e.tokens || 0), 0);
    const totalResponseTime = [
      ...apiCalls,
      ...cacheHits,
      ...ruleMatches,
    ].reduce((sum, e) => sum + (e.responseTime || 0), 0);
    const totalResponses = apiCalls.length + cacheHits.length + ruleMatches.length;

    const cacheRequests = cacheHits.length + cacheMisses.length;
    const cacheHitRate =
      cacheRequests > 0 ? cacheHits.length / cacheRequests : 0;

    return {
      totalEvents: recentEvents.length,
      apiCalls: apiCalls.length,
      cacheHits: cacheHits.length,
      cacheMisses: cacheMisses.length,
      ruleMatches: ruleMatches.length,
      errors: errors.length,
      totalCost,
      totalTokens,
      avgResponseTime:
        totalResponses > 0 ? totalResponseTime / totalResponses : 0,
      cacheHitRate,
    };
  }

  /**
   * Flush events to server (for server-side analytics)
   */
  private async flushToServer(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      // In production, send to analytics endpoint
      if (typeof window !== "undefined") {
        await fetch("/api/ai/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: this.events }),
        });
        // Clear events after successful flush
        this.events = [];
      }
    } catch (error) {
      console.warn("Failed to flush analytics:", error);
      // Keep events for retry
    }
  }

  /**
   * Get all events (for debugging)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

// Singleton instance
let analyticsInstance: AnalyticsTracker | null = null;

/**
 * Get analytics tracker instance
 */
export function getAnalytics(): AnalyticsTracker {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsTracker();
  }
  return analyticsInstance;
}

// Export convenience functions
export const trackAPICall = (
  model: string,
  tokens: number,
  cost: number,
  responseTime: number,
  userId?: string,
  query?: string
) => getAnalytics().trackAPICall(model, tokens, cost, responseTime, userId, query);

export const trackCacheHit = (
  cacheType: "client" | "server" | "precomputed",
  responseTime: number,
  userId?: string
) => getAnalytics().trackCacheHit(cacheType, responseTime, userId);

export const trackCacheMiss = (userId?: string, query?: string) =>
  getAnalytics().trackCacheMiss(userId, query);

export const trackRuleMatch = (responseTime: number, userId?: string) =>
  getAnalytics().trackRuleMatch(responseTime, userId);

export const trackError = (error: string, userId?: string, query?: string) =>
  getAnalytics().trackError(error, userId, query);

export const getStats = (timeWindowMs?: number) =>
  getAnalytics().getStats(timeWindowMs);


