import { ActivityType } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export async function setRepositoryStar(input: { repositoryId: string; userId: string; starred: boolean }) {
  const prisma = getPrisma();

  if (input.starred) {
    return prisma.$transaction(async (tx) => {
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

        return { starred: true, starCount: repository.starCount };
      }

      const repository = await tx.repository.findUniqueOrThrow({
        where: { id: input.repositoryId },
        select: { starCount: true },
      });

      return { starred: true, starCount: repository.starCount };
    });
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
