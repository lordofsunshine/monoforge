import { ActivityType, IssueBoardStatus, IssuePriority, IssueStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { createIssueDigest, type createIssueSchema, type updateIssueSchema } from "@/lib/validation/issues";
import type { z } from "zod";
import { ensureDefaultIssueLabels } from "@/server/issues/labels";

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;

export async function createIssue(repositoryId: string, authorId: string, input: CreateIssueInput) {
  const prisma = getPrisma();
  await ensureDefaultIssueLabels(repositoryId);

  return prisma.$transaction(async (tx) => {
    const latest = await tx.issue.findFirst({
      where: { repositoryId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const number = (latest?.number || 0) + 1;
    const labels = input.labels.length
      ? await tx.issueLabel.findMany({
          where: {
            repositoryId,
            slug: { in: input.labels },
          },
          select: { id: true },
        })
      : [];

    const issue = await tx.issue.create({
      data: {
        repositoryId,
        authorId,
        number,
        title: input.title,
        body: input.body || null,
        digest: createIssueDigest(input.title, input.body),
        priority: input.priority as IssuePriority,
        boardStatus: input.boardStatus as IssueBoardStatus,
        sourcePath: input.sourcePath || null,
        sourceLine: input.sourceLine || null,
        labels: {
          create: labels.map((label) => ({ labelId: label.id })),
        },
      },
    });

    await tx.repository.update({
      where: { id: repositoryId },
      data: { issueCount: { increment: 1 } },
    });

    await tx.repoActivity.create({
      data: {
        repositoryId,
        actorId: authorId,
        type: ActivityType.ISSUE_OPENED,
        title: `Issue #${number} opened`,
        issueNumber: number,
      },
    });

    return issue;
  });
}

export async function updateIssue(issueId: string, repositoryId: string, input: UpdateIssueInput) {
  const prisma = getPrisma();
  await ensureDefaultIssueLabels(repositoryId);

  return prisma.$transaction(async (tx) => {
    const labels = input.labels.length
      ? await tx.issueLabel.findMany({
          where: {
            repositoryId,
            slug: { in: input.labels },
          },
          select: { id: true },
        })
      : [];

    await tx.issueLabelLink.deleteMany({
      where: { issueId },
    });

    return tx.issue.update({
      where: { id: issueId },
      data: {
        title: input.title,
        body: input.body || null,
        digest: createIssueDigest(input.title, input.body),
        priority: input.priority as IssuePriority,
        boardStatus: input.boardStatus as IssueBoardStatus,
        labels: {
          create: labels.map((label) => ({ labelId: label.id })),
        },
      },
    });
  });
}

export async function setIssueStatus(input: {
  issueId: string;
  repositoryId: string;
  actorId: string;
  number: number;
  status: IssueStatus;
}) {
  const prisma = getPrisma();
  const closing = input.status === IssueStatus.CLOSED;

  await prisma.$transaction([
    prisma.issue.update({
      where: { id: input.issueId },
      data: {
        status: input.status,
        boardStatus: closing ? IssueBoardStatus.DONE : IssueBoardStatus.TODO,
        closedAt: closing ? new Date() : null,
      },
    }),
    prisma.repoActivity.create({
      data: {
        repositoryId: input.repositoryId,
        actorId: input.actorId,
        type: closing ? ActivityType.ISSUE_CLOSED : ActivityType.ISSUE_OPENED,
        title: `Issue #${input.number} ${closing ? "closed" : "reopened"}`,
        issueNumber: input.number,
      },
    }),
  ]);
}

export async function createIssueComment(issueId: string, repositoryId: string, issueNumber: number, authorId: string, body: string) {
  const prisma = getPrisma();

  return prisma.$transaction([
    prisma.issueComment.create({
      data: { issueId, authorId, body },
    }),
    prisma.issue.update({
      where: { id: issueId },
      data: { commentCount: { increment: 1 } },
    }),
    prisma.repoActivity.create({
      data: {
        repositoryId,
        actorId: authorId,
        type: ActivityType.ISSUE_COMMENTED,
        title: `Comment added to issue #${issueNumber}`,
        issueNumber,
      },
    }),
  ]);
}
