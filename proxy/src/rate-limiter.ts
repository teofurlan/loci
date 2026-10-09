export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export type TokenBucketOptions = {
  /** Burst size, and the number of requests allowed per window once the bucket is drained. */
  capacity: number;
  /** Time to refill a full bucket, in milliseconds. */
  windowMs: number;
  now: () => number;
  /** Upper bound on tracked keys; idle (fully refilled) buckets are evicted first. */
  maxKeys?: number;
};

type Bucket = { tokens: number; updatedAt: number };

/**
 * In-memory token bucket per key. State lives in the function instance, so on a serverless
 * platform the limit is per instance and best-effort: it slows abuse, it is not a hard quota.
 */
export class TokenBucketLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxKeys: number;

  constructor(private readonly options: TokenBucketOptions) {
    this.maxKeys = options.maxKeys ?? 10_000;
  }

  get size(): number {
    return this.buckets.size;
  }

  take(key: string): RateLimitResult {
    const { capacity, windowMs } = this.options;
    const now = this.options.now();
    const refillPerMs = capacity / windowMs;

    const bucket = this.buckets.get(key) ?? { tokens: capacity, updatedAt: now };
    bucket.tokens = Math.min(capacity, bucket.tokens + (now - bucket.updatedAt) * refillPerMs);
    bucket.updatedAt = now;

    if (!this.buckets.has(key)) {
      if (this.buckets.size >= this.maxKeys) this.evictIdle(now);
      this.buckets.set(key, bucket);
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true };
    }
    return { allowed: false, retryAfterSeconds: Math.ceil(Math.round((1 - bucket.tokens) / refillPerMs) / 1000) };
  }

  private evictIdle(now: number): void {
    const { capacity, windowMs } = this.options;
    for (const [key, bucket] of this.buckets) {
      const refilled = bucket.tokens + ((now - bucket.updatedAt) * capacity) / windowMs;
      if (refilled >= capacity) this.buckets.delete(key);
    }
  }
}
