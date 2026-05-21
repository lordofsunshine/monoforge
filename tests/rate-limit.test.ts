import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, cleanupExpiredRateLimits, getRateLimitBucketCount, resetRateLimits } from "@/lib/rate-limit";

describe("rate limit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests under the limit", () => {
    expect(checkRateLimit("login:test", 2, 1000, 100).allowed).toBe(true);
    expect(checkRateLimit("login:test", 2, 1000, 200).allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    checkRateLimit("register:test", 1, 1000, 100);
    expect(checkRateLimit("register:test", 1, 1000, 200).allowed).toBe(false);
  });

  it("resets after the window", () => {
    checkRateLimit("login:reset", 1, 1000, 100);
    expect(checkRateLimit("login:reset", 1, 1000, 1200).allowed).toBe(true);
  });

  it("removes expired buckets during cleanup", () => {
    checkRateLimit("login:a", 1, 1000, 100);
    checkRateLimit("login:b", 1, 1000, 200);

    expect(getRateLimitBucketCount()).toBe(2);

    cleanupExpiredRateLimits(1300, true);

    expect(getRateLimitBucketCount()).toBe(0);
  });
});
