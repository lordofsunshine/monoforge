import { checkRateLimit } from "@/lib/rate-limit";

export const rateLimitProfiles = {
  login: { limit: 5, windowMs: 60_000 },
  register: { limit: 3, windowMs: 60_000 },
  upload: { limit: 300, windowMs: 60_000 },
  issue: { limit: 15, windowMs: 60_000 },
  comment: { limit: 30, windowMs: 60_000 },
  search: { limit: 60, windowMs: 60_000 },
  star: { limit: 60, windowMs: 60_000 },
  download: { limit: 120, windowMs: 60_000 },
  archive: { limit: 10, windowMs: 60_000 },
  translate: { limit: 12, windowMs: 60_000 },
  browse: { limit: 240, windowMs: 60_000 },
  raw: { limit: 600, windowMs: 60_000 },
  thumbnail: { limit: 600, windowMs: 60_000 },
  view: { limit: 60, windowMs: 60_000 },
  health: { limit: 60, windowMs: 60_000 },
} as const;

export const globalRateLimit = {
  sustained: { limit: 600, windowMs: 60_000 },
  burst: { limit: 120, windowMs: 5_000 },
} as const;

export type RateLimitProfile = keyof typeof rateLimitProfiles;

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Try again soon.");
  }
}

export function enforceRateLimit(profile: RateLimitProfile, key: string) {
  const config = rateLimitProfiles[profile];
  const result = checkRateLimit(`${profile}:${key}`, config.limit, config.windowMs);

  if (!result.allowed) {
    throw new RateLimitError();
  }

  return result;
}

export type GlobalRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function enforceGlobalRateLimit(key: string, now = Date.now()): GlobalRateLimitResult {
  const burst = checkRateLimit(`global:burst:${key}`, globalRateLimit.burst.limit, globalRateLimit.burst.windowMs, now);

  if (!burst.allowed) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((burst.resetAt - now) / 1000)) };
  }

  const sustained = checkRateLimit(`global:sustained:${key}`, globalRateLimit.sustained.limit, globalRateLimit.sustained.windowMs, now);

  if (!sustained.allowed) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((sustained.resetAt - now) / 1000)) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
