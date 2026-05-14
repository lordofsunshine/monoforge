import { describe, expect, it } from "vitest";
import { parseSearchParams } from "@/lib/validation/search";

describe("search validation", () => {
  it("normalizes defaults and caps limit", () => {
    const params = new URLSearchParams({ q: "  mono  " });
    const parsed = parseSearchParams(params);

    expect(parsed.q).toBe("mono");
    expect(parsed.scope).toBe("global");
    expect(parsed.type).toBe("all");
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it("rejects invalid repo context", () => {
    const params = new URLSearchParams({ q: "readme", scope: "repo", owner: "../root", repo: "mono" });

    expect(() => parseSearchParams(params)).toThrow();
  });

  it("rejects oversized limits", () => {
    const params = new URLSearchParams({ q: "repo", limit: "100" });

    expect(() => parseSearchParams(params)).toThrow();
  });
});
