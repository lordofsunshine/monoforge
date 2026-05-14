import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(120, "Search query is too long")
    .default(""),
  scope: z.enum(["global", "repo"]).default("global"),
  type: z.enum(["all", "repositories", "users", "issues", "files"]).default("all"),
  owner: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  repo: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9._-]*$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(20).default(20),
  offset: z.coerce.number().int().min(0).max(500).default(0),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

export function parseSearchParams(searchParams: URLSearchParams) {
  return searchQuerySchema.parse({
    q: searchParams.get("q") ?? "",
    scope: searchParams.get("scope") ?? "global",
    type: searchParams.get("type") ?? "all",
    owner: searchParams.get("owner") || undefined,
    repo: searchParams.get("repo") || undefined,
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });
}
