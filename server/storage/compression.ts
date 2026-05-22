import { createReadStream, createWriteStream } from "node:fs";
import { copyFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Transform, type Writable } from "node:stream";
import { getEnv } from "@/lib/env";

const zstdTextExtensions = new Set(["md", "mdx", "json", "js", "jsx", "ts", "tsx", "css", "scss", "html", "txt", "yaml", "yml", "xml", "csv", "toml", "sql", "prisma"]);
const alreadyCompressedExtensions = new Set(["zip", "gz", "7z", "rar", "jpg", "jpeg", "png", "webp", "avif", "gif", "mp4", "mov", "mp3", "wav", "pdf"]);

export function shouldCompress(mime: string | null | undefined, extension: string | null | undefined) {
  const ext = extension?.toLowerCase().replace(/^\./, "");

  if (ext && alreadyCompressedExtensions.has(ext)) {
    return false;
  }

  if (ext && zstdTextExtensions.has(ext)) {
    return true;
  }

  return Boolean(mime?.startsWith("text/") || mime === "application/json" || mime === "application/xml");
}

function runZstd(args: string[], inputPath?: string, outputPath?: string) {
  return new Promise<void>((resolve, reject) => {
    const env = getEnv();
    const child = spawn("zstd", args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        child.kill("SIGKILL");
        reject(new Error("zstd timed out"));
      }
    }, env.PROCESS_TIMEOUT_MS);

    const stderr: Buffer[] = [];
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`zstd failed for ${inputPath || ""} ${outputPath || ""}: ${Buffer.concat(stderr).toString("utf8")}`));
    });
  });
}

export async function compressWithZstd(inputPath: string, outputPath: string) {
  const env = getEnv();
  await runZstd(["-q", `-${env.ZSTD_LEVEL}`, "-f", "-o", outputPath, inputPath], inputPath, outputPath);
}

export function createDecompressionLimitStream(maxBytes: number) {
  let written = 0;

  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      written += chunk.length;

      if (written > maxBytes) {
        callback(new Error("Decompressed output exceeds allowed size"));
        return;
      }

      callback(null, chunk);
    },
  });
}

export async function decompressWithZstd(inputPath: string, outputStream: Writable, maxOutputBytes?: number) {
  const env = getEnv();
  const child = spawn("zstd", ["-q", "-d", "-c", inputPath], {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const stderr: Buffer[] = [];
  const timer = setTimeout(() => child.kill("SIGKILL"), env.PROCESS_TIMEOUT_MS);
  child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

  try {
    const output = typeof maxOutputBytes === "number" ? pipeline(child.stdout, createDecompressionLimitStream(maxOutputBytes), outputStream) : pipeline(child.stdout, outputStream);

    await Promise.all([
      output,
      new Promise<void>((resolve, reject) => {
        child.on("error", reject);
        child.on("close", (code) => {
          if (code === 0) {
            resolve();
            return;
          }

          reject(new Error(`zstd decompression failed: ${Buffer.concat(stderr).toString("utf8") || "process timed out"}`));
        });
      }),
    ]);
  } finally {
    clearTimeout(timer);
    child.kill("SIGKILL");
  }
}

export async function copyStoredFile(inputPath: string, outputPath: string) {
  await copyFile(inputPath, outputPath);
}

export async function streamStoredFile(inputPath: string, outputStream: Writable) {
  await pipeline(createReadStream(inputPath), outputStream);
}

export async function writeStreamToFile(inputPath: string, outputPath: string) {
  await pipeline(createReadStream(inputPath), createWriteStream(outputPath));
}
