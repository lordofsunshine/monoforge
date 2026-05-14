import { RepositoryVisibility } from "@/generated/prisma/client";

export function canReadRepository(input: { visibility: RepositoryVisibility; ownerId: string; viewerId?: string | null }) {
  return input.visibility !== RepositoryVisibility.PRIVATE || input.ownerId === input.viewerId;
}

export function canWriteRepository(input: { ownerId: string; viewerId?: string | null }) {
  return Boolean(input.viewerId && input.ownerId === input.viewerId);
}

export function canMutateIssue(input: { ownerId: string; authorId: string; viewerId?: string | null }) {
  return Boolean(input.viewerId && (input.viewerId === input.ownerId || input.viewerId === input.authorId));
}
