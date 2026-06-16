import { getEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { createRepositoryForUser } from "@/server/repositories/service";
import { uploadRepositoryFilesBatch } from "@/server/repositories/files";
import { downloadTarball, type GithubRepository } from "@/server/mirror/github";
import { extractTarballToTemp, type ExtractedFile, type ExtractedTarball } from "@/server/mirror/tarball";
import { githubLoginToUsername, usernameWithSuffix } from "@/server/mirror/usernames";

const mirrorStorageBytes = 10n * 1024n * 1024n * 1024n;
const maxUsernameAttempts = 50;
const maxDescriptionLength = 240;

export type MirrorUser = {
  id: string;
  username: string;
};

export type ImportResult = {
  uploaded: number;
  rejected: number;
  truncated: boolean;
};

export async function ensureMirrorUser(githubLogin: string): Promise<MirrorUser> {
  const prisma = getPrisma();
  const existing = await prisma.user.findFirst({
    where: { mirroredFrom: githubLogin },
    select: { id: true, username: true },
  });

  if (existing) {
    return existing;
  }

  const base = githubLoginToUsername(githubLogin);

  for (let attempt = 0; attempt < maxUsernameAttempts; attempt += 1) {
    const username = usernameWithSuffix(base, attempt);
    const taken = await prisma.user.findUnique({ where: { username }, select: { id: true } });

    if (taken) {
      continue;
    }

    const user = await prisma.user.create({
      data: {
        username,
        name: githubLogin,
        mirroredFrom: githubLogin,
        image: `https://github.com/${githubLogin}.png`,
        storageQuota: {
          create: { maxStorageBytes: mirrorStorageBytes },
        },
      },
      select: { id: true, username: true },
    });

    return user;
  }

  throw new Error("Could not allocate a username for the mirror account");
}

export async function createMirrorRepository(user: MirrorUser, repository: GithubRepository) {
  const prisma = getPrisma();
  const description = repository.description ? repository.description.slice(0, maxDescriptionLength) : null;
  const created = await createRepositoryForUser(user, {
    name: repository.name,
    description: description || "",
    visibility: "PUBLIC",
    initializeWithReadme: false,
  });

  await prisma.repository.update({
    where: { id: created.id },
    data: { mirrorSourceUrl: repository.htmlUrl },
  });

  return created;
}

export async function extractMirrorRepository(repository: GithubRepository): Promise<ExtractedTarball> {
  const env = getEnv();
  const tarball = await downloadTarball(repository.ownerLogin, repository.name, repository.defaultBranch);
  return extractTarballToTemp(tarball, {
    maxFileBytes: env.MIRROR_MAX_FILE_MB * 1024 * 1024,
    maxFiles: env.MIRROR_MAX_FILES,
    maxTotalBytes: env.MIRROR_MAX_REPO_MB * 1024 * 1024,
  });
}

export async function uploadMirrorRepository(input: {
  repositoryId: string;
  authorId: string;
  repository: GithubRepository;
  files: ExtractedFile[];
  truncated: boolean;
}): Promise<ImportResult> {
  if (!input.files.length) {
    return { uploaded: 0, rejected: 0, truncated: input.truncated };
  }

  const result = await uploadRepositoryFilesBatch({
    repositoryId: input.repositoryId,
    authorId: input.authorId,
    files: input.files,
    message: `Mirror import from ${input.repository.htmlUrl}`,
  });

  return {
    uploaded: result.uploaded.length,
    rejected: result.rejected.length,
    truncated: input.truncated,
  };
}
