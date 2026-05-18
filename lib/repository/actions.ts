"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/security/audit-log";
import { createRepositorySchema, deleteFileSchema, updateRepositorySchema } from "@/lib/validation/repository";
import { deleteRepositoryFile } from "@/server/repositories/files";
import { createRepositoryForUser, deleteRepositoryForUser, updateRepositoryForUser } from "@/server/repositories/service";
import { setRepositoryStar } from "@/server/repositories/stars";

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

  let repository: Awaited<ReturnType<typeof createRepositoryForUser>>;

  try {
    repository = await createRepositoryForUser({ id: user.id, username: user.username }, parsed.data);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Repository could not be created." };
  }

  redirect(`/${user.username}/${repository.slug}`);
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

  const previous = await getPrisma().repository.findUnique({
    where: { id: repositoryId },
    select: { slug: true },
  });
  let updated: Awaited<ReturnType<typeof updateRepositoryForUser>>;

  try {
    updated = await updateRepositoryForUser(repositoryId, user.id, parsed.data);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Repository could not be updated." };
  }

  if (previous && updated.slug !== previous.slug) {
    redirect(`/${user.username}/${updated.slug}/settings`);
  }

  return { ok: true, message: "Repository updated." };
}

export async function deleteRepositoryAction(repositoryId: string) {
  const user = await requireSessionUserId();
  await deleteRepositoryForUser({ repositoryId, actorId: user.id }).catch(() => undefined);

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
