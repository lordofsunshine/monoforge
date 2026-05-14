"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { IssueStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";
import { createIssueSchema, issueCommentSchema, issueStateSchema, maintainerNoteSchema, updateIssueSchema } from "@/lib/validation/issues";
import { canChangeIssueState, canDeleteIssue, getIssueForViewer, getRepositoryIssueContext } from "@/server/issues/access";
import { createIssue, createIssueComment, setIssueStatus, updateIssue } from "@/server/issues/service";

export type IssueFormState = {
  ok: boolean;
  message: string;
};

async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

function formLabels(formData: FormData) {
  return formData.getAll("labels").map(String).filter(Boolean);
}

export async function createIssueAction(owner: string, repo: string, _state: IssueFormState, formData: FormData): Promise<IssueFormState> {
  const authorId = await requireUserId();
  const ip = await getRequestIp();
  const limited = checkRateLimit(`issue:create:${authorId}:${ip}`, 20, 60_000);

  if (!limited.allowed) {
    return { ok: false, message: "Too many issue requests. Try again soon." };
  }

  const repository = await getRepositoryIssueContext(owner, repo, authorId);
  const parsed = createIssueSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    priority: formData.get("priority") || "NORMAL",
    boardStatus: formData.get("boardStatus") || "TODO",
    labels: formLabels(formData),
    sourcePath: formData.get("sourcePath"),
    sourceLine: formData.get("sourceLine") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  const issue = await createIssue(repository.id, authorId, parsed.data);
  redirect(`/${repository.owner.username}/${repository.slug}/issues/${issue.number}`);
}

export async function updateIssueAction(owner: string, repo: string, number: number, _state: IssueFormState, formData: FormData): Promise<IssueFormState> {
  const viewerId = await requireUserId();
  const repository = await getRepositoryIssueContext(owner, repo, viewerId);
  const issue = await getIssueForViewer(repository.id, number);

  if (!canChangeIssueState({ viewerId, ownerId: repository.ownerId, authorId: issue.authorId })) {
    return { ok: false, message: "You cannot edit this issue." };
  }

  const parsed = updateIssueSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    priority: formData.get("priority"),
    boardStatus: formData.get("boardStatus"),
    labels: formLabels(formData),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  await updateIssue(issue.id, repository.id, parsed.data);
  return { ok: true, message: "Issue updated." };
}

export async function setIssueStatusAction(owner: string, repo: string, number: number, status: IssueStatus | "OPEN" | "CLOSED") {
  const viewerId = await requireUserId();
  const repository = await getRepositoryIssueContext(owner, repo, viewerId);
  const issue = await getIssueForViewer(repository.id, number);

  if (!canChangeIssueState({ viewerId, ownerId: repository.ownerId, authorId: issue.authorId })) {
    return;
  }

  await setIssueStatus({
    issueId: issue.id,
    repositoryId: repository.id,
    actorId: viewerId,
    number: issue.number,
    status: status as IssueStatus,
  });
}

export async function addCommentAction(owner: string, repo: string, number: number, _state: IssueFormState, formData: FormData): Promise<IssueFormState> {
  const authorId = await requireUserId();
  const ip = await getRequestIp();
  const limited = checkRateLimit(`issue:comment:${authorId}:${ip}`, 40, 60_000);

  if (!limited.allowed) {
    return { ok: false, message: "Too many comments. Try again soon." };
  }

  const repository = await getRepositoryIssueContext(owner, repo, authorId);
  const issue = await getIssueForViewer(repository.id, number);
  const parsed = issueCommentSchema.safeParse({
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  await createIssueComment(issue.id, repository.id, issue.number, authorId, parsed.data.body);
  return { ok: true, message: "Comment added." };
}

export async function deleteIssueAction(owner: string, repo: string, number: number) {
  const viewerId = await requireUserId();
  const repository = await getRepositoryIssueContext(owner, repo, viewerId);
  const issue = await getIssueForViewer(repository.id, number);

  if (!canDeleteIssue({ viewerId, ownerId: repository.ownerId })) {
    return;
  }

  await getPrisma().$transaction([
    getPrisma().issue.delete({ where: { id: issue.id } }),
    getPrisma().repository.update({ where: { id: repository.id }, data: { issueCount: { decrement: 1 } } }),
  ]);

  redirect(`/${repository.owner.username}/${repository.slug}/issues`);
}

export async function saveMaintainerNoteAction(owner: string, repo: string, number: number, _state: IssueFormState, formData: FormData): Promise<IssueFormState> {
  const viewerId = await requireUserId();
  const repository = await getRepositoryIssueContext(owner, repo, viewerId);

  if (repository.ownerId !== viewerId) {
    return { ok: false, message: "Only the repository owner can edit maintainer notes." };
  }

  const issue = await getIssueForViewer(repository.id, number);
  const parsed = maintainerNoteSchema.safeParse({
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  if (!parsed.data.body) {
    await getPrisma().issueMaintainerNote.deleteMany({ where: { issueId: issue.id } });
    return { ok: true, message: "Maintainer note cleared." };
  }

  await getPrisma().issueMaintainerNote.upsert({
    where: { issueId: issue.id },
    update: { body: parsed.data.body, authorId: viewerId },
    create: { issueId: issue.id, authorId: viewerId, body: parsed.data.body },
  });

  return { ok: true, message: "Maintainer note saved." };
}
