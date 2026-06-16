import { FileKind } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { labelRepositoryLanguage, resolveRepositoryLanguage } from "@/lib/repository/languages";

export type RepositoryLanguageStat = {
  language: string;
  bytes: number;
  percent: number;
};

export function calculateRepositoryLanguages(files: Array<{ language: string | null; size: bigint | number }>): RepositoryLanguageStat[] {
  const totals = new Map<string, number>();

  for (const file of files) {
    if (!file.language) {
      continue;
    }

    const language = labelRepositoryLanguage(file.language);
    totals.set(language, (totals.get(language) ?? 0) + Number(file.size));
  }

  const totalBytes = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

  if (!totalBytes) {
    return [];
  }

  const stats = Array.from(totals.entries())
    .map(([language, bytes]) => ({
      language,
      bytes,
      percent: Math.max(1, Math.floor((bytes / totalBytes) * 100)),
      remainder: (bytes / totalBytes) * 100 - Math.floor((bytes / totalBytes) * 100),
    }))
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 8);
  let remaining = Math.max(0, 100 - stats.reduce((sum, item) => sum + item.percent, 0));

  for (const item of [...stats].sort((left, right) => right.remainder - left.remainder)) {
    if (!remaining) {
      break;
    }

    item.percent += 1;
    remaining -= 1;
  }

  return stats.map(({ remainder: _remainder, ...item }) => item);
}

export async function getRepositoryLanguages(repositoryId: string): Promise<RepositoryLanguageStat[]> {
  const files = await getPrisma().repositoryFile.findMany({
    where: {
      repositoryId,
      kind: FileKind.FILE,
    },
    select: {
      path: true,
      extension: true,
      language: true,
      size: true,
    },
    orderBy: { path: "asc" },
  });

  return calculateRepositoryLanguages(
    files.map((file) => ({
      language: resolveRepositoryLanguage(file.path, file.extension, file.language),
      size: file.size,
    })),
  );
}
