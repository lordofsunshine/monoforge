import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { RepositoryVisibility } from "@/generated/prisma/client";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}

export async function getRepositoryForViewer(owner: string, slug: string) {
  const session = await auth();
  const prisma = getPrisma();
  const repository = await prisma.repository.findFirst({
    where: {
      slug,
      owner: {
        username: owner,
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
  });

  if (!repository) {
    notFound();
  }

  if (repository.visibility === RepositoryVisibility.PRIVATE && repository.ownerId !== session?.user?.id) {
    redirect("/login");
  }

  return repository;
}
