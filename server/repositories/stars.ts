import { ActivityType } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { dispatchRepositoryWebhooks } from "@/server/storage/webhooks";

export async function setRepositoryStar(input: { repositoryId: string; userId: string; starred: boolean }) {
  const prisma = getPrisma();

  if (input.starred) {
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.star.createMany({
        data: {
          userId: input.userId,
          repositoryId: input.repositoryId,
        },
        skipDuplicates: true,
      });

      if (created.count === 1) {
        const repository = await tx.repository.update({
          where: { id: input.repositoryId },
          data: { starCount: { increment: 1 } },
          select: { starCount: true },
        });

        await tx.repoActivity.create({
          data: {
            repositoryId: input.repositoryId,
            actorId: input.userId,
            type: ActivityType.STAR_ADDED,
            title: "Repository starred",
          },
        });

        return { starred: true, starCount: repository.starCount, changed: true };
      }

      const repository = await tx.repository.findUniqueOrThrow({
        where: { id: input.repositoryId },
        select: { starCount: true },
      });

      return { starred: true, starCount: repository.starCount, changed: false };
    });

    if (result.changed) {
      await dispatchRepositoryWebhooks({
        repositoryId: input.repositoryId,
        event: "repository.starred",
        payload: { userId: input.userId, starCount: result.starCount },
      });
    }

    return { starred: result.starred, starCount: result.starCount };
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.star.deleteMany({
      where: {
        userId: input.userId,
        repositoryId: input.repositoryId,
      },
    });

    if (deleted.count === 1) {
      const repository = await tx.repository.update({
        where: { id: input.repositoryId },
        data: { starCount: { decrement: 1 } },
        select: { starCount: true },
      });

      await tx.repoActivity.create({
        data: {
          repositoryId: input.repositoryId,
          actorId: input.userId,
          type: ActivityType.STAR_REMOVED,
          title: "Repository unstarred",
        },
      });

      return { starred: false, starCount: repository.starCount };
    }

    const repository = await tx.repository.findUniqueOrThrow({
      where: { id: input.repositoryId },
      select: { starCount: true },
    });

    return { starred: false, starCount: repository.starCount };
  });
}
