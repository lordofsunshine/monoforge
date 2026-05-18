"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ActivityType, RepositoryVisibility } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/security/audit-log";
import { createRepositorySchema, deleteFileSchema, slugifyRepositoryName, updateRepositorySchema } from "@/lib/validation/repository";
import { upsertRepositoryFile, deleteRepositoryFile } from "@/server/repositories/files";
import { setRepositoryStar } from "@/server/repositories/stars";
import { deleteBlobIfUnused } from "@/server/storage/service";

export type RepoFormState = {
  ok: boolean;
  message: string;
};

const okState: RepoFormState = {
  ok: true,
  message: "",
};

async function requireSessionUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}

export async function createRepositoryAction(_state: RepoFormState, formData: FormData): Promise<RepoFormState> {
  const user = await requireSessionUserId();
  const parsed = createRepositorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    visibility: formData.get("visibility"),
    initializeWithReadme: formData.get("initializeWithReadme") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  const prisma = getPrisma();
  const slug = slugifyRepositoryName(parsed.data.name);

  if (!slug) {
    return { ok: false, message: "Repository name cannot be converted to a safe URL." };
  }

  const existing = await prisma.repository.findFirst({
    where: {
      ownerId: user.id,
      OR: [{ name: parsed.data.name }, { slug }],
    },
    select: { id: true },
  });

  if (existing) {
    return { ok: false, message: "Repository name is already taken." };
  }

  const repository = await prisma.repository.create({
    data: {
      ownerId: user.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      visibility: parsed.data.visibility as RepositoryVisibility,
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

  if (parsed.data.initializeWithReadme) {
    const readme = Buffer.from(`# ${parsed.data.name}\n\n${parsed.data.description || "A MonoForge repository."}\n`, "utf8");
    await upsertRepositoryFile({
      repositoryId: repository.id,
      authorId: user.id,
      path: "README.md",
      buffer: readme,
      message: "Initialize README",
    });
  }

  redirect(`/${user.username}/${slug}`);
}

export async function updateRepositoryAction(repositoryId: string, _state: RepoFormState, formData: FormData): Promise<RepoFormState> {
  const user = await requireSessionUserId();
  const parsed = updateRepositorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  const prisma = getPrisma();
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { id: true, ownerId: true, slug: true, name: true, visibility: true },
  });

  if (!repository || repository.ownerId !== user.id) {
    return { ok: false, message: "Repository not found." };
  }

  const nextSlug = slugifyRepositoryName(parsed.data.name);
  const existing = await prisma.repository.findFirst({
    where: {
      ownerId: user.id,
      NOT: { id: repositoryId },
      OR: [{ name: parsed.data.name }, { slug: nextSlug }],
    },
    select: { id: true },
  });

  if (existing) {
    return { ok: false, message: "Repository name is already taken." };
  }

  const updated = await prisma.repository.update({
    where: { id: repositoryId },
    data: {
      name: parsed.data.name,
      slug: nextSlug,
      description: parsed.data.description || null,
      visibility: parsed.data.visibility as RepositoryVisibility,
    },
  });

  if (repository.visibility !== parsed.data.visibility) {
    await prisma.repoActivity.create({
      data: {
        repositoryId,
        actorId: user.id,
        type: ActivityType.REPOSITORY_VISIBILITY_CHANGED,
        title: `Visibility changed to ${parsed.data.visibility.toLowerCase()}`,
      },
    });
    await writeAuditLog({
      actorId: user.id,
      action: "CHANGE_REPOSITORY_VISIBILITY",
      repositoryId,
      target: updated.slug,
      metadata: { from: repository.visibility, to: parsed.data.visibility },
    });
  }

  if (repository.name !== parsed.data.name || repository.slug !== nextSlug) {
    await prisma.repoActivity.create({
      data: {
        repositoryId,
        actorId: user.id,
        type: ActivityType.REPOSITORY_RENAMED,
        title: `Repository renamed to ${nextSlug}`,
      },
    });
    await writeAuditLog({
      actorId: user.id,
      action: "RENAME_REPOSITORY",
      repositoryId,
      target: nextSlug,
      metadata: { from: repository.slug, to: nextSlug },
    });
  }

  await prisma.commitLite.create({
    data: {
      repositoryId,
      authorId: user.id,
      message: "Update repository settings",
      changedFiles: [],
    },
  });

  if (nextSlug !== repository.slug) {
    redirect(`/${user.username}/${nextSlug}/settings`);
  }

  return { ok: true, message: "Repository updated." };
}

export async function deleteRepositoryAction(repositoryId: string) {
  const user = await requireSessionUserId();
  const prisma = getPrisma();
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { id: true, ownerId: true, slug: true },
  });

  if (!repository || repository.ownerId !== user.id) {
    redirect("/dashboard");
  }

  const files = await prisma.repositoryFile.findMany({
    where: {
      repositoryId,
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
    actorId: user.id,
    action: "DELETE_REPOSITORY",
    repositoryId,
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
      where: { id: repositoryId },
    });
  });

  await Promise.all([...new Set([...blobUsage.values()].map((item) => item.hash))].map((hash) => deleteBlobIfUnused(hash).catch(() => false)));

  redirect("/dashboard");
}

export async function deleteFileAction(repositoryId: string, _state: RepoFormState, formData: FormData): Promise<RepoFormState> {
  const user = await requireSessionUserId();
  const parsed = deleteFileSchema.safeParse({
    path: formData.get("path"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  try {
    await deleteRepositoryFile({
      repositoryId,
      authorId: user.id,
      path: parsed.data.path,
      message: parsed.data.message || undefined,
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Delete failed." };
  }

  await writeAuditLog({
    actorId: user.id,
    action: "DELETE_FILE",
    repositoryId,
    target: parsed.data.path,
  });

  return { ...okState, message: "File deleted." };
}

export async function toggleStarAction(repositoryId: string) {
  const user = await requireSessionUserId();
  const prisma = getPrisma();

  const existing = await prisma.star.findUnique({
    where: {
      userId_repositoryId: {
        userId: user.id,
        repositoryId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await setRepositoryStar({ repositoryId, userId: user.id, starred: false });
    return;
  }

  await setRepositoryStar({ repositoryId, userId: user.id, starred: true });
}
