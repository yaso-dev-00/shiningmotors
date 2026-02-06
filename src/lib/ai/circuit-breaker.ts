// Circuit breaker pattern for AI API calls
// Prevents cascading failures and gracefully degrades to cache

interface CircuitState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  nextAttemptTime: number;
}

const CIRCUIT_CONFIG = {
  failureThreshold: 5, // Open circuit after 5 failures
  successThreshold: 2, // Close circuit after 2 successes in half-open
  timeout: 60000, // 1 minute before attempting to close
  window: 60000, // 1 minute window for failure counting
};

class CircuitBreaker {
  private state: CircuitState = {
    state: "closed",
    failureCount: 0,
    lastFailureTime: 0,
    successCount: 0,
    nextAttemptTime: 0,
  };

  /**
   * Check if circuit is open (should not make API calls)
   */
  isOpen(): boolean {
    const now = Date.now();
    
    // If circuit is open, check if we should try half-open
    if (this.state.state === "open") {
      if (now >= this.state.nextAttemptTime) {
        this.state.state = "half-open";
        this.state.successCount = 0;
        return false; // Allow one attempt
      }
      return true; // Still open, block requests
    }
    
    return false; // Closed or half-open, allow requests
  }

  /**
   * Record a successful API call
   */
  recordSuccess(): void {
    if (this.state.state === "half-open") {
      this.state.successCount++;
      if (this.state.successCount >= CIRCUIT_CONFIG.successThreshold) {
        // Close the circuit
        this.state.state = "closed";
        this.state.failureCount = 0;
        this.state.successCount = 0;
      }
    } else if (this.state.state === "closed") {
      // Reset failure count on success
      this.state.failureCount = Math.max(0, this.state.failureCount - 1);
    }
  }

  /**
   * Record a failed API call
   */
  recordFailure(): void {
    const now = Date.now();
    
    // Reset failure count if outside the time window
    if (
      now - this.state.lastFailureTime >
      CIRCUIT_CONFIG.window
    ) {
      this.state.failureCount = 0;
    }
    
    this.state.failureCount++;
    this.state.lastFailureTime = now;
    
    if (this.state.failureCount >= CIRCUIT_CONFIG.failureThreshold) {
      // Open the circuit
      this.state.state = "open";
      this.state.nextAttemptTime = now + CIRCUIT_CONFIG.timeout;
    } else if (this.state.state === "half-open") {
      // Failed in half-open, go back to open
      this.state.state = "open";
      this.state.nextAttemptTime = now + CIRCUIT_CONFIG.timeout;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return { ...this.state };
  }

  /**
   * Reset circuit breaker (for testing/admin)
   */
  reset(): void {
    this.state = {
      state: "closed",
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
      nextAttemptTime: 0,
    };
  }
}

// Singleton instance
let circuitBreakerInstance: CircuitBreaker | null = null;

/**
 * Get the circuit breaker instance
 */
export function getCircuitBreaker(): CircuitBreaker {
  if (!circuitBreakerInstance) {
    circuitBreakerInstance = new CircuitBreaker();
  }
  return circuitBreakerInstance;
}

/**
 * Check if API calls should be made (circuit is closed or half-open)
 */
export function canMakeAPICall(): boolean {
  return !getCircuitBreaker().isOpen();
}

/**
 * Record API success
 */
export function recordAPISuccess(): void {
  getCircuitBreaker().recordSuccess();
}

/**
 * Record API failure
 */
export function recordAPIFailure(): void {
  getCircuitBreaker().recordFailure();
}

/**
 * Get circuit breaker status (for monitoring)
 */
export function getCircuitBreakerStatus(): CircuitState {
  return getCircuitBreaker().getState();
}


