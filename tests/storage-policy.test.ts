import { describe, expect, it } from "vitest";
import { getRawResponsePolicy, safeDownloadFileName, shouldBlockPreview } from "@/lib/security/file-policy";
import { shouldCompress } from "@/server/storage/compression";
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
});
