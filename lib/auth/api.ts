import { createHash, timingSafeEqual } from "node:crypto";
import { auth } from "@/auth";
import { ApiTokenStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export type ApiSession = {
  user: {
    id: string;
    username: string;
    email?: string | null;
  };
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isSameHash(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function bearerToken(request?: Request) {
  const authorization = request?.headers.get("authorization");

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    const apiKey = request?.headers.get("x-api-key")?.trim();
    return apiKey && apiKey.length >= 16 ? apiKey : null;
  }

  const token = authorization.slice(7).trim();
  return token.length >= 16 ? token : null;
}

export async function getApiSession(request?: Request): Promise<ApiSession | null> {
  const session = await auth();

  if (session?.user?.id && session.user.username) {
    return {
      user: {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
      },
    };
  }

  const token = bearerToken(request);

  if (!token) {
    return null;
  }

  const tokenHash = sha256(token);
  const apiToken = await getPrisma().apiToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  if (!apiToken || apiToken.status !== ApiTokenStatus.ACTIVE) {
    return null;
  }

  if (!isSameHash(apiToken.tokenHash, tokenHash)) {
    return null;
  }

  if (apiToken.expiresAt && apiToken.expiresAt <= new Date()) {
    return null;
  }

  await getPrisma().apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    user: {
      id: apiToken.user.id,
      username: apiToken.user.username,
      email: apiToken.user.email,
    },
  };
}
