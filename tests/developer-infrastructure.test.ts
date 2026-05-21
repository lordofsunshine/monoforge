import { describe, expect, it } from "vitest";
import { buildDiscordWebhookPayload, createWebhookSignature, isDiscordWebhookUrl, shouldDeliverWebhookEvent } from "@/server/storage/webhooks";
import { buildApiToken, hashApiToken, publicTokenPrefix } from "@/server/storage/tokens";
import { isOrphanBlobCandidate } from "@/server/storage/gc";

describe("developer infrastructure helpers", () => {
  it("creates personal access tokens with a public prefix and stores only a hash", () => {
    const raw = buildApiToken();
    const hash = hashApiToken(raw);

    expect(raw).toMatch(/^mf_pat_[a-f0-9]{64}$/);
    expect(publicTokenPrefix(raw)).toBe(raw.slice(0, 15));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe(raw);
  });

  it("signs webhook payloads deterministically", () => {
    const signature = createWebhookSignature("secret", JSON.stringify({ event: "issue.opened" }));

    expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    expect(signature).toBe(createWebhookSignature("secret", JSON.stringify({ event: "issue.opened" })));
    expect(signature).not.toBe(createWebhookSignature("other", JSON.stringify({ event: "issue.opened" })));
  });

  it("matches wildcard and explicit webhook event subscriptions", () => {
    expect(shouldDeliverWebhookEvent(["*"], "file.uploaded")).toBe(true);
    expect(shouldDeliverWebhookEvent(["file.uploaded"], "file.uploaded")).toBe(true);
    expect(shouldDeliverWebhookEvent(["issue.opened"], "file.uploaded")).toBe(false);
  });

  it("detects Discord webhook URLs", () => {
    expect(isDiscordWebhookUrl("https://discord.com/api/webhooks/123/token")).toBe(true);
    expect(isDiscordWebhookUrl("https://discordapp.com/api/webhooks/123/token")).toBe(true);
    expect(isDiscordWebhookUrl("https://example.com/api/webhooks/123/token")).toBe(false);
  });

  it("builds Discord-compatible webhook payloads", () => {
    const payload = buildDiscordWebhookPayload({
      event: "file.uploaded",
      repository: {
        name: "Example",
        slug: "example",
        description: "A test repository",
        owner: {
          username: "owner",
        },
      },
      payload: {
        message: "release",
        files: [{ path: "README.md" }, { path: "src/app.ts" }],
      },
    });

    expect(payload.content).toContain("Uploaded 2 files");
    expect(payload.embeds[0]?.fields.some((field) => field.name === "Repository")).toBe(true);
    expect(JSON.stringify(payload)).toContain("README.md");
    expect(payload.allowed_mentions.parse).toEqual([]);
  });

  it("marks only unreferenced blobs as garbage collector candidates", () => {
    expect(isOrphanBlobCandidate({ refCount: 0, files: [] })).toBe(true);
    expect(isOrphanBlobCandidate({ refCount: -1, files: [] })).toBe(true);
    expect(isOrphanBlobCandidate({ refCount: 1, files: [] })).toBe(false);
    expect(isOrphanBlobCandidate({ refCount: 0, files: [{ id: "file" }] })).toBe(false);
  });
});
