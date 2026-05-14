import { writeFile, rm } from "node:fs/promises";
import { Writable } from "node:stream";
import { ActivityType, FileKind, RepositoryVisibility } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { assertAllowedExtension, getDirectoryPaths, getParentPath, getRepoExtension, getRepoFileName, normalizeRepoPath } from "@/lib/repository/paths";
import { ensureStorageDirs, getStoragePath } from "@/server/storage/paths";
import { deleteBlobIfUnused, saveBlob, streamBlobToOutput } from "@/server/storage/service";

export const maxMvpFileSize = 10 * 1024 * 1024;
export const maxMvpRepoSize = 200 * 1024 * 1024;
export const maxMvpFilesPerRepo = 1000;
export const textPreviewLimit = 1024 * 1024;

const textExtensions = new Set([
  "txt",
  "md",
  "mdx",
  "ts",
  "tsx",
  "js",
  "jsx",
  "css",
  "scss",
  "html",
  "json",
  "yaml",
  "yml",
  "toml",
  "xml",
  "csv",
  "prisma",
  "sql",
  "sh",
  "ps1",
]);

export function isBinaryBuffer(buffer: Buffer) {
  if (buffer.includes(0)) {
    return true;
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  let suspicious = 0;

  for (const byte of sample) {
    if ((byte < 7 || (byte > 14 && byte < 32)) && byte !== 9 && byte !== 10 && byte !== 13) {
      suspicious += 1;
    }
  }

  return sample.length > 0 && suspicious / sample.length > 0.08;
}

export function isMarkdownPath(repoPath: string) {
  const extension = getRepoExtension(repoPath);
  return extension === "md" || extension === "mdx";
}

export function isTextLike(repoPath: string, mimeType: string | null, isBinary: boolean) {
  if (isBinary) {
    return false;
  }

  if (mimeType?.startsWith("text/")) {
    return true;
  }

  const extension = getRepoExtension(repoPath);
  return extension ? textExtensions.has(extension) : false;
}

export function languageFromPath(repoPath: string) {
  const extension = getRepoExtension(repoPath);
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    css: "css",
    scss: "scss",
    html: "html",
    json: "json",
    md: "markdown",
    mdx: "markdown",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    sql: "sql",
    prisma: "prisma",
    sh: "bash",
    ps1: "powershell",
  };

  return extension ? map[extension] || extension : null;
}

export async function ensureRepoWritable(repositoryId: string, userId: string) {
  const prisma = getPrisma();
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: {
      id: true,
      ownerId: true,
      repoSize: true,
      fileCount: true,
    },
  });

  if (!repository) {
    throw new Error("Repository not found");
  }

  if (repository.ownerId !== userId) {
    throw new Error("You do not have access to this repository");
  }

  return repository;
}

export async function ensureRepoReadable(owner: string, repo: string, viewerId?: string) {
  const prisma = getPrisma();
  const repository = await prisma.repository.findFirst({
    where: {
      slug: repo,
      owner: { username: owner },
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
    throw new Error("Repository not found");
  }

  if (repository.visibility === RepositoryVisibility.PRIVATE && repository.ownerId !== viewerId) {
    throw new Error("You do not have access to this repository");
  }

  return repository;
}

export async function createDirectoryMetadata(repositoryId: string, repoPath: string) {
  const prisma = getPrisma();
  const directories = getDirectoryPaths(repoPath);

  for (const directoryPath of directories) {
    await prisma.repositoryFile.upsert({
      where: {
        repositoryId_path: {
          repositoryId,
          path: directoryPath,
        },
      },
      update: {},
      create: {
        repositoryId,
        path: directoryPath,
        parentPath: getParentPath(directoryPath),
        name: getRepoFileName(directoryPath),
        kind: FileKind.DIRECTORY,
        size: 0,
      },
    });
  }
}

export async function upsertRepositoryFile(input: {
  repositoryId: string;
  authorId: string;
  path: string;
  buffer: Buffer;
  message?: string;
}) {
  const tmpPath = getStoragePath(`tmp/${input.authorId}-${Date.now()}.buffer-upload`);
  await ensureStorageDirs();
  await writeFile(tmpPath, input.buffer);

  try {
    return await upsertRepositoryFileFromTemp({
      repositoryId: input.repositoryId,
      authorId: input.authorId,
      path: input.path,
      tmpPath,
      originalName: input.path,
      byteSize: input.buffer.length,
      message: input.message,
    });
  } catch (error) {
    await rm(tmpPath, { force: true });
    throw error;
  }
}

export async function upsertRepositoryFileFromTemp(input: {
  repositoryId: string;
  authorId: string;
  path: string;
  tmpPath: string;
  originalName: string;
  byteSize: number;
  message?: string;
}) {
  const prisma = getPrisma();
  const repoPath = normalizeRepoPath(input.path);
  assertAllowedExtension(repoPath);

  if (input.byteSize > maxMvpFileSize) {
    throw new Error("File is over 10 MB");
  }

  await ensureRepoWritable(input.repositoryId, input.authorId);
  const extension = getRepoExtension(repoPath);
  const blob = await saveBlob({
    tmpPath: input.tmpPath,
    originalName: input.originalName || repoPath,
    userId: input.authorId,
    byteSize: input.byteSize,
  });

  await prisma.$transaction(async (tx) => {
    const repository = await tx.repository.findUnique({
      where: { id: input.repositoryId },
      select: {
        ownerId: true,
        repoSize: true,
        fileCount: true,
      },
    });

    if (!repository || repository.ownerId !== input.authorId) {
      throw new Error("Repository not found");
    }

    const previousFile = await tx.repositoryFile.findUnique({
      where: {
        repositoryId_path: {
          repositoryId: input.repositoryId,
          path: repoPath,
        },
      },
      select: {
        id: true,
        blobId: true,
        hash: true,
        size: true,
        kind: true,
      },
    });

    if (previousFile?.kind === FileKind.DIRECTORY) {
      throw new Error("A directory already exists at this path");
    }

    const nextRepoSize = BigInt(repository.repoSize) - BigInt(previousFile?.size || 0) + BigInt(input.byteSize);
    const nextFileCount = repository.fileCount + (previousFile ? 0 : 1);

    if (Number(nextRepoSize) > maxMvpRepoSize) {
      throw new Error("Repository is over 200 MB");
    }

    if (nextFileCount > maxMvpFilesPerRepo) {
      throw new Error("Repository is over 1000 files");
    }

    for (const directoryPath of getDirectoryPaths(repoPath)) {
      await tx.repositoryFile.upsert({
        where: {
          repositoryId_path: {
            repositoryId: input.repositoryId,
            path: directoryPath,
          },
        },
        update: {},
        create: {
          repositoryId: input.repositoryId,
          path: directoryPath,
          parentPath: getParentPath(directoryPath),
          name: getRepoFileName(directoryPath),
          kind: FileKind.DIRECTORY,
          size: 0,
        },
      });
    }

    if (previousFile?.blobId && previousFile.blobId !== blob.id) {
      await tx.fileBlob.update({
        where: { id: previousFile.blobId },
        data: { refCount: { decrement: 1 } },
      });
    }

    if (previousFile?.hash !== blob.checksum) {
      await tx.fileBlob.update({
        where: { id: blob.id },
        data: { refCount: { increment: 1 } },
      });
    }

    await tx.repositoryFile.upsert({
      where: {
        repositoryId_path: {
          repositoryId: input.repositoryId,
          path: repoPath,
        },
      },
      update: {
        blobId: blob.id,
        name: getRepoFileName(repoPath),
        extension,
        size: blob.originalSize,
        mimeType: blob.mimeType,
        hash: blob.checksum,
        language: languageFromPath(repoPath),
        isBinary: blob.isBinary,
        isReadme: repoPath.toLowerCase() === "readme.md",
      },
      create: {
        repositoryId: input.repositoryId,
        blobId: blob.id,
        path: repoPath,
        parentPath: getParentPath(repoPath),
        name: getRepoFileName(repoPath),
        extension,
        kind: FileKind.FILE,
        size: blob.originalSize,
        mimeType: blob.mimeType,
        hash: blob.checksum,
        language: languageFromPath(repoPath),
        isBinary: blob.isBinary,
        isReadme: repoPath.toLowerCase() === "readme.md",
      },
    });

    await tx.repository.update({
      where: { id: input.repositoryId },
      data: {
        repoSize: nextRepoSize,
        fileCount: nextFileCount,
        readmePath: repoPath.toLowerCase() === "readme.md" ? repoPath : undefined,
        lastPushedAt: new Date(),
      },
    });

    const commit = await tx.commitLite.create({
      data: {
        repositoryId: input.repositoryId,
        authorId: input.authorId,
        message: input.message || (previousFile ? `Update ${repoPath}` : `Upload ${repoPath}`),
        changedFiles: [repoPath],
        checksum: blob.checksum,
        filesAdded: previousFile ? 0 : 1,
        filesChanged: previousFile ? 1 : 0,
        bytesAdded: blob.originalSize,
        bytesDeleted: previousFile?.size || 0,
      },
    });

    await tx.repoActivity.create({
      data: {
        repositoryId: input.repositoryId,
        actorId: input.authorId,
        type: previousFile ? ActivityType.FILE_UPDATED : ActivityType.FILE_UPLOADED,
        title: previousFile ? `File updated: ${repoPath}` : `File uploaded: ${repoPath}`,
        targetPath: repoPath,
        commitLiteId: commit.id,
      },
    });
  });

  return repoPath;
}

export async function deleteRepositoryFile(input: {
  repositoryId: string;
  authorId: string;
  path: string;
  message?: string;
}) {
  const prisma = getPrisma();
  const repoPath = normalizeRepoPath(input.path);
  await ensureRepoWritable(input.repositoryId, input.authorId);

  const file = await prisma.repositoryFile.findUnique({
    where: {
      repositoryId_path: {
        repositoryId: input.repositoryId,
        path: repoPath,
      },
    },
    select: {
      id: true,
      blobId: true,
      hash: true,
      size: true,
      kind: true,
    },
  });

  if (!file || file.kind !== FileKind.FILE) {
    throw new Error("File not found");
  }

  await prisma.repositoryFile.delete({
    where: { id: file.id },
  });

  if (file.blobId) {
    await prisma.fileBlob.update({
      where: { id: file.blobId },
      data: { refCount: { decrement: 1 } },
    });
    if (file.hash) {
      await deleteBlobIfUnused(file.hash);
    }
  }

  await prisma.repository.update({
    where: { id: input.repositoryId },
    data: {
      repoSize: { decrement: file.size },
      fileCount: { decrement: 1 },
      lastPushedAt: new Date(),
    },
  });

  const commit = await prisma.commitLite.create({
    data: {
      repositoryId: input.repositoryId,
      authorId: input.authorId,
      message: input.message || `Delete ${repoPath}`,
      changedFiles: [repoPath],
      filesDeleted: 1,
      bytesDeleted: file.size,
    },
  });

  await prisma.repoActivity.create({
    data: {
      repositoryId: input.repositoryId,
      actorId: input.authorId,
      type: ActivityType.FILE_DELETED,
      title: `File deleted: ${repoPath}`,
      targetPath: repoPath,
      commitLiteId: commit.id,
    },
  });
}

export async function readRepositoryFileText(repositoryFileId: string) {
  const prisma = getPrisma();
  const file = await prisma.repositoryFile.findUnique({
    where: { id: repositoryFileId },
    include: { blob: true },
  });

  if (!file?.blob) {
    throw new Error("File not found");
  }

  if (!isTextLike(file.path, file.mimeType, file.isBinary)) {
    return null;
  }

  if (Number(file.size) > textPreviewLimit) {
    return null;
  }

  const chunks: Buffer[] = [];
  const sink = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });
  await streamBlobToOutput(file.blob, sink);
  return Buffer.concat(chunks).toString("utf8");
}
