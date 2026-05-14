import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/rate-limit";

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
});
