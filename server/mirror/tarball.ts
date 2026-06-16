import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import { extract } from "tar-stream";
import { getStoragePath, getTmpDir } from "@/server/storage/paths";

export type ExtractedFile = {
  path: string;
  tmpPath: string;
  originalName: string;
  byteSize: number;
};

export type ExtractedTarball = {
  files: ExtractedFile[];
  truncated: boolean;
  fileLimitExceeded: boolean;
  cleanup: () => Promise<void>;
};

export type ExtractTarballOptions = {
  maxFileBytes: number;
  maxFiles: number;
  maxTotalBytes: number;
};

function stripRootSegment(name: string) {
  const normalized = name.replaceAll("\\", "/").split("/").filter(Boolean);
  return normalized.slice(1).join("/");
}

function isUnsafeEntryPath(repoPath: string) {
  return !repoPath || repoPath.split("/").some((segment) => segment === "." || segment === "..");
}

export async function extractTarballToTemp(input: Readable, options: ExtractTarballOptions): Promise<ExtractedTarball> {
  const tmpDir = getTmpDir();
  await mkdir(tmpDir, { recursive: true });

  const files: ExtractedFile[] = [];
  const writtenPaths: string[] = [];
  let totalBytes = 0;
  let truncated = false;
  let fileLimitExceeded = false;

  const cleanup = async () => {
    await Promise.all(writtenPaths.map((tmpPath) => rm(tmpPath, { force: true })));
  };

  const gunzip = createGunzip();
  const extractor = extract();

  input.on("error", (error) => extractor.destroy(error));
  gunzip.on("error", (error) => extractor.destroy(error));
  input.pipe(gunzip).pipe(extractor);

  try {
    await new Promise<void>((resolve, reject) => {
      extractor.on("entry", (header, stream, next) => {
        const skip = () => {
          stream.on("end", next);
          stream.resume();
        };

        if (header.type !== "file") {
          skip();
          return;
        }

        const repoPath = stripRootSegment(header.name);
        const entrySize = header.size || 0;

        if (isUnsafeEntryPath(repoPath) || entrySize > options.maxFileBytes) {
          skip();
          return;
        }

        if (files.length >= options.maxFiles) {
          truncated = true;
          fileLimitExceeded = true;
          skip();
          return;
        }

        if (totalBytes + entrySize > options.maxTotalBytes) {
          truncated = true;
          skip();
          return;
        }

        const tmpPath = getStoragePath(`tmp/mirror-${randomUUID()}.entry`);
        writtenPaths.push(tmpPath);
        const writeStream = createWriteStream(tmpPath);
        let byteSize = 0;

        stream.on("data", (chunk: Buffer) => {
          byteSize += chunk.length;
        });
        stream.on("error", reject);
        writeStream.on("error", reject);
        writeStream.on("finish", () => {
          totalBytes += byteSize;
          files.push({
            path: repoPath,
            tmpPath,
            originalName: repoPath,
            byteSize,
          });
          next();
        });

        stream.pipe(writeStream);
      });

      extractor.on("finish", resolve);
      extractor.on("error", reject);
    });
  } catch (error) {
    await cleanup();
    throw error;
  }

  return { files, truncated, fileLimitExceeded, cleanup };
}
