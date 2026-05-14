import { normalizeRepoPath } from "@/lib/repository/paths";

const blockedPathPrefixes = ["storage", "etc", "proc", "root"];

export function sanitizeRepositoryPath(input: string) {
  const decoded = decodeURIComponent(input);
  const normalized = normalizeRepoPath(decoded);
  const firstSegment = normalized.split("/")[0]?.toLowerCase();

  if (firstSegment && blockedPathPrefixes.includes(firstSegment)) {
    throw new Error("Path is not allowed");
  }

  return normalized;
}
