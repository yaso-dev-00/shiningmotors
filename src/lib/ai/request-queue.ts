// Request queuing system for handling peak traffic
// Queues requests with priority handling

interface QueuedRequest {
  id: string;
  query: string;
  userId?: string;
  userTier: "free" | "premium" | "vendor";
  priority: number; // Higher = more priority
  timestamp: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private maxQueueSize = 100;
  private maxQueueTime = 30000; // 30 seconds
  private processingInterval = 100; // Process every 100ms

  /**
   * Calculate priority based on user tier and other factors
   */
  private calculatePriority(
    userTier: "free" | "premium" | "vendor",
    isActiveSession: boolean = true
  ): number {
    const tierPriority = {
      vendor: 100,
      premium: 50,
      free: 10,
    };
    
    const basePriority = tierPriority[userTier];
    return basePriority + (isActiveSession ? 10 : 0);
  }

  /**
   * Add request to queue
   */
  async enqueue(
    query: string,
    userId: string | undefined,
    processor: (query: string, userId?: string) => Promise<any>,
    userTier: "free" | "premium" | "vendor" = "free"
  ): Promise<any> {
    // Check queue size
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("Request queue is full. Please try again later.");
    }

    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `${Date.now()}-${Math.random()}`,
        query,
        userId,
        userTier,
        priority: this.calculatePriority(userTier),
        timestamp: Date.now(),
        resolve,
        reject,
        timeout: setTimeout(() => {
          // Remove from queue if timeout
          const index = this.queue.findIndex((r) => r.id === request.id);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error("Request timeout: Queue wait time exceeded"));
          }
        }, this.maxQueueTime),
      };

      // Insert in priority order (higher priority first)
      const insertIndex = this.queue.findIndex(
        (r) => r.priority < request.priority
      );
      if (insertIndex === -1) {
        this.queue.push(request);
      } else {
        this.queue.splice(insertIndex, 0, request);
      }

      // Start processing if not already
      if (!this.processing) {
        this.startProcessing(processor);
      }
    });
  }

  /**
   * Start processing queue
   */
  private async startProcessing(
    processor: (query: string, userId?: string) => Promise<any>
  ): Promise<void> {
    this.processing = true;

    const processNext = async () => {
      if (this.queue.length === 0) {
        this.processing = false;
        return;
      }

      // Get highest priority request
      const request = this.queue.shift();
      if (!request) {
        this.processing = false;
        return;
      }

      // Clear timeout
      clearTimeout(request.timeout);

      try {
        // Process request
        const result = await processor(request.query, request.userId);
        request.resolve(result);
      } catch (error) {
        request.reject(
          error instanceof Error
            ? error
            : new Error("Request processing failed")
        );
      }

      // Process next after interval
      setTimeout(processNext, this.processingInterval);
    };

    processNext();
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number;
    processing: boolean;
    estimatedWaitTime: number;
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      estimatedWaitTime:
        this.queue.length * this.processingInterval,
    };
  }

  /**
   * Clear queue (for admin/testing)
   */
  clear(): void {
    this.queue.forEach((request) => {
      clearTimeout(request.timeout);
      request.reject(new Error("Queue cleared"));
    });
    this.queue = [];
    this.processing = false;
  }
}

// Singleton instance
let requestQueueInstance: RequestQueue | null = null;

/**
 * Get the request queue instance
 */
export function getRequestQueue(): RequestQueue {
  if (!requestQueueInstance) {
    requestQueueInstance = new RequestQueue();
  }
  return requestQueueInstance;
}

/**
 * Enqueue a request
 */
export async function enqueueRequest(
  query: string,
  userId: string | undefined,
  processor: (query: string, userId?: string) => Promise<any>,
  userTier: "free" | "premium" | "vendor" = "free"
): Promise<any> {
  return getRequestQueue().enqueue(query, userId, processor, userTier);
}

/**
 * Get queue status
 */
export function getQueueStatus() {
  return getRequestQueue().getStatus();
}


