import { IssueStatus, RepositoryVisibility } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export async function getRepositoryIssueContext(owner: string, repo: string, viewerId?: string) {
  const repository = await getPrisma().repository.findFirst({
    where: {
      slug: repo,
      owner: { username: owner },
    },
    include: {
      owner: {
        select: { id: true, username: true },
      },
    },
  });

  if (!repository) {
    throw new Error("Repository not found");
  }

  if (repository.visibility === RepositoryVisibility.PRIVATE && repository.ownerId !== viewerId) {
    throw new Error("Repository not found");
  }

  return repository;
}

export async function getIssueForViewer(repositoryId: string, number: number) {
  const issue = await getPrisma().issue.findUnique({
    where: {
      repositoryId_number: {
        repositoryId,
        number,
      },
    },
    include: {
      author: {
        select: { id: true, username: true, image: true },
      },
      labels: {
        include: { label: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, username: true, image: true },
          },
        },
      },
      maintainerNote: true,
    },
  });

  if (!issue) {
    throw new Error("Issue not found");
  }

  return issue;
}

export function canChangeIssueState(input: { viewerId?: string; ownerId: string; authorId: string }) {
  return Boolean(input.viewerId && (input.viewerId === input.ownerId || input.viewerId === input.authorId));
}

export function canDeleteIssue(input: { viewerId?: string; ownerId: string }) {
  return Boolean(input.viewerId && input.viewerId === input.ownerId);
}

export function getNextBoardStatus(status: IssueStatus) {
  return status === IssueStatus.CLOSED ? "DONE" : undefined;
}
