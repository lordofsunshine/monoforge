import { rm, stat } from "node:fs/promises";
import path from "node:path";
import { ActivityType, RepositoryVisibility } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/security/audit-log";
import { createRepositorySchema, slugifyRepositoryName, updateRepositorySchema } from "@/lib/validation/repository";
import { upsertRepositoryFile } from "@/server/repositories/files";
import { deleteBlobIfUnused } from "@/server/storage/service";
import { getStorageRoot } from "@/server/storage/paths";
import type { z } from "zod";

export type CreateRepositoryInput = z.infer<typeof createRepositorySchema>;
export type UpdateRepositoryInput = z.infer<typeof updateRepositorySchema>;

export async function createRepositoryForUser(user: { id: string; username: string }, input: CreateRepositoryInput) {
  const prisma = getPrisma();
  const slug = slugifyRepositoryName(input.name);

  if (!slug) {
    throw new Error("Repository name cannot be converted to a safe URL.");
  }

  const existing = await prisma.repository.findFirst({
    where: {
      ownerId: user.id,
      OR: [{ name: input.name }, { slug }],
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Repository name is already taken.");
  }

  const repository = await prisma.repository.create({
    data: {
      ownerId: user.id,
      name: input.name,
      slug,
      description: input.description || null,
      visibility: input.visibility as RepositoryVisibility,
    },
  });

  await prisma.$transaction([
    prisma.commitLite.create({
      data: {
        repositoryId: repository.id,
        authorId: user.id,
        message: "Create repository",
        changedFiles: [],
      },
    }),
    prisma.repoActivity.create({
      data: {
        repositoryId: repository.id,
        actorId: user.id,
        type: ActivityType.REPOSITORY_CREATED,
        title: "Repository created",
      },
    }),
  ]);

  if (input.initializeWithReadme) {
    const readme = Buffer.from(`# ${input.name}\n\n${input.description || "A MonoForge repository."}\n`, "utf8");
    await upsertRepositoryFile({
      repositoryId: repository.id,
      authorId: user.id,
      path: "README.md",
      buffer: readme,
      message: "Initialize README",
    });
  }

  return repository;
}

export async function updateRepositoryForUser(repositoryId: string, userId: string, input: UpdateRepositoryInput) {
  const prisma = getPrisma();
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { id: true, ownerId: true, slug: true, name: true, visibility: true },
  });

  if (!repository || repository.ownerId !== userId) {
    throw new Error("Repository not found.");
  }

  const nextSlug = slugifyRepositoryName(input.name);
  const existing = await prisma.repository.findFirst({
    where: {
      ownerId: userId,
      NOT: { id: repositoryId },
      OR: [{ name: input.name }, { slug: nextSlug }],
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Repository name is already taken.");
  }

  const updated = await prisma.repository.update({
    where: { id: repositoryId },
    data: {
      name: input.name,
      slug: nextSlug,
      description: input.description || null,
      visibility: input.visibility as RepositoryVisibility,
    },
  });

  if (repository.visibility !== input.visibility) {
    await prisma.repoActivity.create({
      data: {
        repositoryId,
        actorId: userId,
        type: ActivityType.REPOSITORY_VISIBILITY_CHANGED,
        title: `Visibility changed to ${input.visibility.toLowerCase()}`,
      },
    });
    await writeAuditLog({
      actorId: userId,
      action: "CHANGE_REPOSITORY_VISIBILITY",
      repositoryId,
      target: updated.slug,
      metadata: { from: repository.visibility, to: input.visibility },
    });
  }

  if (repository.name !== input.name || repository.slug !== nextSlug) {
    await prisma.repoActivity.create({
      data: {
        repositoryId,
        actorId: userId,
        type: ActivityType.REPOSITORY_RENAMED,
        title: `Repository renamed to ${nextSlug}`,
      },
    });
    await writeAuditLog({
      actorId: userId,
      action: "RENAME_REPOSITORY",
      repositoryId,
      target: nextSlug,
      metadata: { from: repository.slug, to: nextSlug },
    });
  }

  await prisma.commitLite.create({
    data: {
      repositoryId,
      authorId: userId,
      message: "Update repository settings",
      changedFiles: [],
    },
  });

  return updated;
}

export async function deleteRepositoryForUser(input: {
  repositoryId: string;
  actorId: string;
}) {
  const prisma = getPrisma();
  const repository = await prisma.repository.findUnique({
    where: { id: input.repositoryId },
    select: { id: true, ownerId: true, slug: true, gitPath: true },
  });

  if (!repository || repository.ownerId !== input.actorId) {
    throw new Error("Repository not found.");
  }

  const files = await prisma.repositoryFile.findMany({
    where: {
      repositoryId: input.repositoryId,
      blobId: { not: null },
      hash: { not: null },
    },
    select: {
      blobId: true,
      hash: true,
    },
  });
  const blobUsage = new Map<string, { hash: string; count: number }>();

  for (const file of files) {
    if (!file.blobId || !file.hash) {
      continue;
    }

    const current = blobUsage.get(file.blobId);
    blobUsage.set(file.blobId, {
      hash: file.hash,
      count: (current?.count || 0) + 1,
    });
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE_REPOSITORY",
    repositoryId: input.repositoryId,
    target: repository.slug,
  });

  await prisma.$transaction(async (tx) => {
    for (const [blobId, item] of blobUsage) {
      await tx.fileBlob.update({
        where: { id: blobId },
        data: { refCount: { decrement: item.count } },
      });
    }

    await tx.repository.delete({
      where: { id: input.repositoryId },
    });
  });

  await Promise.all([...new Set([...blobUsage.values()].map((item) => item.hash))].map((hash) => deleteBlobIfUnused(hash).catch(() => false)));

  if (repository.gitPath) {
    const storageRoot = getStorageRoot();
    const absoluteGitPath = path.resolve(storageRoot, repository.gitPath);

    if (absoluteGitPath.startsWith(storageRoot)) {
      await stat(absoluteGitPath)
        .then(() => rm(absoluteGitPath, { recursive: true, force: true }))
        .catch(() => undefined);
    }
  }

  return { ok: true };
}
