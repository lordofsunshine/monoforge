import { Prisma, type AuditAction } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: AuditAction;
  repositoryId?: string | null;
  target?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonObject;
}) {
  await getPrisma().auditLog.create({
    data: {
      actorId: input.actorId || null,
      action: input.action,
      repositoryId: input.repositoryId || null,
      target: input.target || null,
      ip: input.ip || null,
      userAgent: input.userAgent || null,
      metadata: input.metadata || undefined,
    },
  });
}
