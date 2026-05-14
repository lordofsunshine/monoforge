import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, CompressionType, FileKind, RepositoryVisibility, ActivityType } from "../generated/prisma/client";
import { hashPassword } from "../lib/auth/password";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStoragePath } from "../server/storage/paths";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hashPassword("admin123456");
  const readmeContent = Buffer.from("# MonoForge\n\nA quiet monochrome project forge with files, issues, stars and storage discipline.\n", "utf8");
  const seedStorageKey = "objects/seed/readme.md.raw";
  const seedStoragePath = getStoragePath(seedStorageKey);
  await mkdir(path.dirname(seedStoragePath), { recursive: true });
  await writeFile(seedStoragePath, readmeContent);
  const user = await prisma.user.upsert({
    where: { email: "admin@monoforge.local" },
    update: {
      name: "MonoForge Admin",
      username: "admin",
      bio: "Maintainer of the local MonoForge instance",
      passwordHash,
    },
    create: {
      name: "MonoForge Admin",
      username: "admin",
      email: "admin@monoforge.local",
      emailVerified: new Date(),
      bio: "Maintainer of the local MonoForge instance",
      passwordHash,
      storageQuota: {
        create: {
          maxStorageBytes: 104857600n,
          maxRepoBytes: 524288000n,
          maxFileBytes: 26214400n,
          maxRepos: 20,
          maxFilesPerRepo: 2000,
          maxIssuesPerRepo: 1000,
        },
      },
    },
  });

  await prisma.storageQuota.upsert({
    where: { userId: user.id },
    update: {
      maxStorageBytes: 104857600n,
      maxRepoBytes: 524288000n,
      maxFileBytes: 26214400n,
      maxRepos: 20,
      maxFilesPerRepo: 2000,
      maxIssuesPerRepo: 1000,
    },
    create: {
      userId: user.id,
      maxStorageBytes: 104857600n,
      maxRepoBytes: 524288000n,
      maxFileBytes: 26214400n,
      maxRepos: 20,
      maxFilesPerRepo: 2000,
      maxIssuesPerRepo: 1000,
    },
  });

  const repository = await prisma.repository.upsert({
    where: {
      ownerId_slug: {
        ownerId: user.id,
        slug: "monoforge",
      },
    },
    update: {
      description: "Minimal monochrome project forge for code, files and issues",
      readmePath: "README.md",
      repoSize: BigInt(readmeContent.length),
      fileCount: 1,
      issueCount: 1,
      defaultBranch: "main",
    },
    create: {
      ownerId: user.id,
      name: "MonoForge",
      slug: "monoforge",
      description: "Minimal monochrome project forge for code, files and issues",
      visibility: RepositoryVisibility.PUBLIC,
      readmePath: "README.md",
      repoSize: BigInt(readmeContent.length),
      fileCount: 1,
      issueCount: 1,
      defaultBranch: "main",
    },
  });

  const blob = await prisma.fileBlob.upsert({
    where: { checksum: "seed-readme-sha256" },
    update: {
      originalSize: BigInt(readmeContent.length),
      compressedSize: BigInt(readmeContent.length),
      compressionType: CompressionType.NONE,
      storageKey: seedStorageKey,
      mimeType: "text/markdown",
      refCount: 1,
    },
    create: {
      checksum: "seed-readme-sha256",
      originalSize: BigInt(readmeContent.length),
      compressedSize: BigInt(readmeContent.length),
      compressionType: CompressionType.NONE,
      storageKey: seedStorageKey,
      mimeType: "text/markdown",
      refCount: 1,
    },
  });

  await prisma.repositoryFile.upsert({
    where: {
      repositoryId_path: {
        repositoryId: repository.id,
        path: "README.md",
      },
    },
    update: {
      blobId: blob.id,
      size: BigInt(readmeContent.length),
      mimeType: "text/markdown",
      hash: blob.checksum,
      isReadme: true,
    },
    create: {
      repositoryId: repository.id,
      blobId: blob.id,
      path: "README.md",
      parentPath: "",
      name: "README.md",
      extension: "md",
      kind: FileKind.FILE,
      size: BigInt(readmeContent.length),
      mimeType: "text/markdown",
      hash: blob.checksum,
      language: "Markdown",
      isBinary: false,
      isReadme: true,
    },
  });

  await prisma.issue.upsert({
    where: {
      repositoryId_number: {
        repositoryId: repository.id,
        number: 1,
      },
    },
    update: {
      title: "Design the first MonoForge repository view",
      body: "Create a quiet monochrome repository screen with README as cover.",
      commentCount: 1,
    },
    create: {
      repositoryId: repository.id,
      authorId: user.id,
      number: 1,
      title: "Design the first MonoForge repository view",
      body: "Create a quiet monochrome repository screen with README as cover.",
      commentCount: 1,
      comments: {
        create: {
          authorId: user.id,
          body: "Seed comment for testing the issue timeline.",
        },
      },
    },
  });

  await prisma.commitLite.create({
    data: {
      repositoryId: repository.id,
      authorId: user.id,
      message: "Seed initial README",
      checksum: "seed-commit-lite",
      filesAdded: 1,
      bytesAdded: BigInt(readmeContent.length),
    },
  });

  await prisma.repoActivity.create({
    data: {
      repositoryId: repository.id,
      actorId: user.id,
      type: ActivityType.REPOSITORY_CREATED,
      title: "Repository created",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
