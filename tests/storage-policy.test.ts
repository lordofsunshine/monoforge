import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { getRawResponsePolicy, safeDownloadFileName, shouldBlockPreview } from "@/lib/security/file-policy";
import { shouldAllowArchiveDownload } from "@/server/repositories/archive-policy";
import { createDecompressionLimitStream, shouldCompress } from "@/server/storage/compression";
import { getPrimaryBlobKey } from "@/server/storage/paths";

describe("storage policy", () => {
  it("compresses text-like source files", () => {
    expect(shouldCompress("text/markdown", "md")).toBe(true);
    expect(shouldCompress("application/json", "json")).toBe(true);
    expect(shouldCompress("text/css", "css")).toBe(true);
  });

  it("skips already compressed and media formats", () => {
    expect(shouldCompress("image/jpeg", "jpg")).toBe(false);
    expect(shouldCompress("application/zip", "zip")).toBe(false);
    expect(shouldCompress("application/pdf", "pdf")).toBe(false);
    expect(shouldCompress("video/mp4", "mp4")).toBe(false);
  });

  it("uses hash-sharded blob keys", () => {
    const hash = "aabbccddeeff0011223344556677889900aabbccddeeff001122334455667788";
    expect(getPrimaryBlobKey(hash, true)).toBe(`blobs/aa/bb/${hash}.zst`);
    expect(getPrimaryBlobKey(hash, false)).toBe(`blobs/aa/bb/${hash}.raw`);
  });

  it("blocks large and binary previews", () => {
    expect(shouldBlockPreview({ size: 1024 * 1024 + 1, isBinary: false })).toBe(true);
    expect(shouldBlockPreview({ size: 100, isBinary: true })).toBe(true);
    expect(shouldBlockPreview({ size: 100, isBinary: false })).toBe(false);
  });

  it("forces active raw content to download as text", () => {
    expect(getRawResponsePolicy("index.html", "text/html")).toEqual({
      contentType: "text/plain; charset=utf-8",
      disposition: "attachment",
    });
    expect(getRawResponsePolicy("logo.svg", "image/svg+xml")).toEqual({
      contentType: "text/plain; charset=utf-8",
      disposition: "attachment",
    });
  });

  it("sanitizes download filenames", () => {
    expect(safeDownloadFileName("../bad\r\nname.html")).toBe(".._badname.html");
  });

  it("stops decompression output once the declared size is exceeded", async () => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });
    const limit = createDecompressionLimitStream(5);
    limit.pipe(sink);

    await expect(
      new Promise<void>((resolve, reject) => {
        limit.on("error", reject);
        sink.on("finish", resolve);
        limit.end(Buffer.from("123456"));
      }),
    ).rejects.toThrow("Decompressed output exceeds allowed size");
    expect(Buffer.concat(chunks).length).toBeLessThanOrEqual(5);
  });

  it("rejects archive downloads beyond the archive budget", () => {
    expect(shouldAllowArchiveDownload({ fileCount: 200, totalSize: 30 * 1024 * 1024 })).toBe(true);
    expect(shouldAllowArchiveDownload({ fileCount: 1001, totalSize: 30 * 1024 * 1024 })).toBe(false);
    expect(shouldAllowArchiveDownload({ fileCount: 200, totalSize: 201 * 1024 * 1024 })).toBe(false);
  });
});
