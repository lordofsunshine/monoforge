type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const maxBuckets = Number(process.env.RATE_LIMIT_MAX_BUCKETS || 20_000);
const cleanupIntervalMs = Number(process.env.RATE_LIMIT_CLEANUP_INTERVAL_MS || 60_000);
let nextCleanupAt = 0;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  cleanupExpiredRateLimits(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

export function resetRateLimits() {
  buckets.clear();
  nextCleanupAt = 0;
}

export function cleanupExpiredRateLimits(now = Date.now(), force = false) {
  if (!force && now < nextCleanupAt && buckets.size <= maxBuckets) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  if (buckets.size > maxBuckets) {
    const overflow = buckets.size - maxBuckets;
    const sortedByExpiry = [...buckets.entries()].sort((left, right) => left[1].resetAt - right[1].resetAt);

    for (let index = 0; index < overflow && index < sortedByExpiry.length; index += 1) {
      buckets.delete(sortedByExpiry[index][0]);
    }
  }

  nextCleanupAt = now + cleanupIntervalMs;
}

export function getRateLimitBucketCount() {
  return buckets.size;
}
