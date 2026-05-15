import { describe, expect, it } from "vitest";
import { createRepoFingerprint } from "@/lib/repository/fingerprint";
import { assertAllowedExtension, getDirectoryPaths, normalizeRepoPath } from "@/lib/repository/paths";

describe("repository utilities", () => {
  it("normalizes safe repository paths", () => {
    expect(normalizeRepoPath("src\\app\\page.tsx")).toBe("src/app/page.tsx");
    expect(getDirectoryPaths("src/app/page.tsx")).toEqual(["src", "src/app"]);
  });

  it("rejects unsafe paths and secret-like files", () => {
    expect(() => normalizeRepoPath("../secret.txt")).toThrow();
    expect(() => normalizeRepoPath("..%2fsecret.txt")).toThrow();
    expect(() => normalizeRepoPath("/etc/passwd")).toThrow();
    expect(() => normalizeRepoPath("storage/blobs/x")).toThrow();
    expect(() => assertAllowedExtension("setup.exe")).not.toThrow();
    expect(() => assertAllowedExtension("run.sh")).not.toThrow();
    expect(() => assertAllowedExtension("plugin.jar")).not.toThrow();
    expect(() => assertAllowedExtension(".env")).toThrow();
    expect(() => assertAllowedExtension("keys/private.pem")).toThrow();
  });

  it("creates deterministic fingerprints", () => {
    expect(createRepoFingerprint("admin/monoforge")).toEqual(createRepoFingerprint("admin/monoforge"));
    expect(createRepoFingerprint("admin/monoforge")).not.toEqual(createRepoFingerprint("admin/other"));
  });
});
