// Batch processor for similar queries
// Groups similar queries together to reduce API calls

interface BatchedRequest {
  id: string;
  query: string;
  userId?: string;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

class BatchProcessor {
  private batch: BatchedRequest[] = [];
  private batchInterval = 2000; // 2 seconds
  private maxBatchSize = 10;
  private processing = false;
  private timeout: NodeJS.Timeout | null = null;

  /**
   * Check if two queries are similar enough to batch
   */
  private areSimilar(query1: string, query2: string): boolean {
    const lower1 = query1.toLowerCase().trim();
    const lower2 = query2.toLowerCase().trim();

    // Exact match
    if (lower1 === lower2) return true;

    // Very similar (difference of 1-2 words)
    const words1 = lower1.split(/\s+/);
    const words2 = lower2.split(/\s+/);

    if (Math.abs(words1.length - words2.length) > 2) return false;

    // Check if most words match
    const commonWords = words1.filter((w) => words2.includes(w));
    const similarity =
      commonWords.length / Math.max(words1.length, words2.length);

    return similarity >= 0.8; // 80% word overlap
  }

  /**
   * Group similar queries
   */
  private groupSimilar(requests: BatchedRequest[]): BatchedRequest[][] {
    const groups: BatchedRequest[][] = [];
    const processed = new Set<string>();

    for (const request of requests) {
      if (processed.has(request.id)) continue;

      const group = [request];
      processed.add(request.id);

      for (const other of requests) {
        if (processed.has(other.id)) continue;
        if (this.areSimilar(request.query, other.query)) {
          group.push(other);
          processed.add(other.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Add request to batch
   */
  async add(
    query: string,
    userId: string | undefined,
    processor: (
      queries: string[],
      userIds: (string | undefined)[]
    ) => Promise<string[]>
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const request: BatchedRequest = {
        id: `${Date.now()}-${Math.random()}`,
        query,
        userId,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.batch.push(request);

      // Process if batch is full
      if (this.batch.length >= this.maxBatchSize) {
        this.processBatch(processor);
      } else if (!this.processing) {
        // Set timeout to process batch
        this.timeout = setTimeout(() => {
          this.processBatch(processor);
        }, this.batchInterval);
      }
    });
  }

  /**
   * Process current batch
   */
  private async processBatch(
    processor: (
      queries: string[],
      userIds: (string | undefined)[]
    ) => Promise<string[]>
  ): Promise<void> {
    if (this.processing || this.batch.length === 0) return;

    this.processing = true;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      // Group similar queries
      const groups = this.groupSimilar(currentBatch);

      // Process each group
      for (const group of groups) {
        if (group.length === 1) {
          // Single query, process individually
          try {
            const results = await processor(
              [group[0].query],
              [group[0].userId]
            );
            group[0].resolve(results[0]);
          } catch (error) {
            group[0].reject(
              error instanceof Error
                ? error
                : new Error("Batch processing failed")
            );
          }
        } else {
          // Multiple similar queries, batch process
          try {
            const queries = group.map((r) => r.query);
            const userIds = group.map((r) => r.userId);
            const results = await processor(queries, userIds);

            // Distribute results
            group.forEach((request, index) => {
              if (results[index]) {
                request.resolve(results[index]);
              } else {
                request.reject(new Error("No result for batched query"));
              }
            });
          } catch (error) {
            // Reject all in group
            group.forEach((request) => {
              request.reject(
                error instanceof Error
                  ? error
                  : new Error("Batch processing failed")
              );
            });
          }
        }
      }
    } catch (error) {
      // Reject all requests
      currentBatch.forEach((request) => {
        request.reject(
          error instanceof Error
            ? error
            : new Error("Batch processing failed")
        );
      });
    } finally {
      this.processing = false;

      // Process remaining batch if any
      if (this.batch.length > 0) {
        this.timeout = setTimeout(() => {
          this.processBatch(processor);
        }, this.batchInterval);
      }
    }
  }

  /**
   * Get batch status
   */
  getStatus(): { batchSize: number; processing: boolean } {
    return {
      batchSize: this.batch.length,
      processing: this.processing,
    };
  }

  /**
   * Clear batch
   */
  clear(): void {
    this.batch.forEach((request) => {
      request.reject(new Error("Batch cleared"));
    });
    this.batch = [];
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.processing = false;
  }
}

// Singleton instance
let batchProcessorInstance: BatchProcessor | null = null;

/**
 * Get batch processor instance
 */
export function getBatchProcessor(): BatchProcessor {
  if (!batchProcessorInstance) {
    batchProcessorInstance = new BatchProcessor();
  }
  return batchProcessorInstance;
}

/**
 * Add request to batch
 */
export async function addToBatch(
  query: string,
  userId: string | undefined,
  processor: (
    queries: string[],
    userIds: (string | undefined)[]
  ) => Promise<string[]>
): Promise<string> {
  return getBatchProcessor().add(query, userId, processor);
}


