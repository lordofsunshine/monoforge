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
