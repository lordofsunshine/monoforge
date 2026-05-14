import { getPrisma } from "@/lib/prisma";

export const defaultIssueLabels = [
  { name: "bug", slug: "bug", marker: "[!]", pattern: "solid" },
  { name: "feature", slug: "feature", marker: "[+]", pattern: "dashed" },
  { name: "question", slug: "question", marker: "[?]", pattern: "dotted" },
  { name: "docs", slug: "docs", marker: "[#]", pattern: "double" },
  { name: "urgent", slug: "urgent", marker: "[!!]", pattern: "heavy" },
];

export async function ensureDefaultIssueLabels(repositoryId: string) {
  const prisma = getPrisma();

  await Promise.all(
    defaultIssueLabels.map((label) =>
      prisma.issueLabel.upsert({
        where: {
          repositoryId_slug: {
            repositoryId,
            slug: label.slug,
          },
        },
        update: {},
        create: {
          repositoryId,
          ...label,
        },
      }),
    ),
  );
}

export async function getRepositoryLabels(repositoryId: string) {
  await ensureDefaultIssueLabels(repositoryId);

  return getPrisma().issueLabel.findMany({
    where: { repositoryId },
    orderBy: { slug: "asc" },
  });
}
