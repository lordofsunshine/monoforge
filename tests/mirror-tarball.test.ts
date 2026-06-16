import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { Readable } from "node:stream";
import { createGzip } from "node:zlib";
import { pack as tarPack } from "tar-stream";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { extractTarballToTemp } from "@/server/mirror/tarball";

let storageRoot = "";

beforeAll(() => {
  process.env.DATABASE_URL ||= "postgresql://test";
  process.env.AUTH_SECRET ||= "0123456789abcdef0123456789abcdef";
  storageRoot = mkdtempSync(path.join(os.tmpdir(), "mirror-tarball-"));
  process.env.STORAGE_PATH = storageRoot;
});

afterAll(() => {
  if (storageRoot) {
    rmSync(storageRoot, { recursive: true, force: true });
  }
});

function addEntry(pack: ReturnType<typeof tarPack>, header: { name: string; type?: "file" | "directory" }, content: Buffer | string | null) {
  return new Promise<void>((resolve, reject) => {
    const done = (error?: Error | null) => (error ? reject(error) : resolve());

    if (content === null) {
      pack.entry(header, done);
      return;
    }

    pack.entry(header, content, done);
  });
}

async function buildTarball() {
  const pack = tarPack();
  const gzip = createGzip();
  const chunks: Buffer[] = [];
  pack.pipe(gzip);
  gzip.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<void>((resolve, reject) => {
    gzip.on("end", resolve);
    gzip.on("error", reject);
    pack.on("error", reject);
  });

  await addEntry(pack, { name: "repo-abc/README.md" }, "hello world");
  await addEntry(pack, { name: "repo-abc/src", type: "directory" }, null);
  await addEntry(pack, { name: "repo-abc/src/index.js" }, "console.log(42)");
  await addEntry(pack, { name: "repo-abc/big.bin" }, Buffer.alloc(2000));
  pack.finalize();

  await finished;
  return Buffer.concat(chunks);
}

describe("mirror tarball extraction", () => {
  it("strips the root prefix, skips directories and oversized files", async () => {
    const buffer = await buildTarball();
    const result = await extractTarballToTemp(Readable.from(buffer), {
      maxFileBytes: 1000,
      maxFiles: 100,
      maxTotalBytes: 10_000,
    });

    const paths = result.files.map((file) => file.path).sort();
    expect(paths).toEqual(["README.md", "src/index.js"]);
    expect(result.truncated).toBe(false);
    expect(result.fileLimitExceeded).toBe(false);

    await result.cleanup();
  });

  it("flags the file count limit when more files are present", async () => {
    const buffer = await buildTarball();
    const result = await extractTarballToTemp(Readable.from(buffer), {
      maxFileBytes: 1000,
      maxFiles: 1,
      maxTotalBytes: 10_000,
    });

    expect(result.files).toHaveLength(1);
    expect(result.truncated).toBe(true);
    expect(result.fileLimitExceeded).toBe(true);

    await result.cleanup();
  });
});
