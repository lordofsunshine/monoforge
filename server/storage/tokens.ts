import { createHash, randomBytes } from "node:crypto";
import { ApiTokenStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

const tokenPrefix = "mf_pat_";

export function buildApiToken() {
  return `${tokenPrefix}${randomBytes(32).toString("hex")}`;
}

export function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function publicTokenPrefix(token: string) {
  return token.slice(0, 15);
}

export async function createApiToken(userId: string, name: string, scopes: string[] = ["repo:read", "repo:write"]) {
  const prisma = getPrisma();
  const rawToken = buildApiToken();
  const tokenHash = hashApiToken(rawToken);
  const prefix = publicTokenPrefix(rawToken);
  const token = await prisma.apiToken.create({
    data: {
      userId,
      name,
      tokenHash,
      prefix,
      scopes,
    },
  });

  return { token, rawToken };
}

export async function revokeApiToken(tokenId: string, userId: string) {
  const prisma = getPrisma();
  return prisma.apiToken.updateMany({
    where: {
      id: tokenId,
      userId,
      status: ApiTokenStatus.ACTIVE,
    },
    data: {
      status: ApiTokenStatus.REVOKED,
      revokedAt: new Date(),
    },
  });
}
