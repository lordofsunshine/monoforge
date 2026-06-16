import { describe, expect, it } from "vitest";
import { isCopyableLicense } from "@/server/mirror/licenses";

describe("mirror licenses", () => {
  it("allows permissive licenses regardless of case", () => {
    expect(isCopyableLicense("MIT")).toBe(true);
    expect(isCopyableLicense("mit")).toBe(true);
    expect(isCopyableLicense("Apache-2.0")).toBe(true);
    expect(isCopyableLicense("BSD-3-Clause")).toBe(true);
    expect(isCopyableLicense("ISC")).toBe(true);
    expect(isCopyableLicense("Unlicense")).toBe(true);
  });

  it("rejects copyleft, unknown and missing licenses", () => {
    expect(isCopyableLicense("GPL-3.0")).toBe(false);
    expect(isCopyableLicense("AGPL-3.0")).toBe(false);
    expect(isCopyableLicense("NOASSERTION")).toBe(false);
    expect(isCopyableLicense("Other")).toBe(false);
    expect(isCopyableLicense("")).toBe(false);
    expect(isCopyableLicense(null)).toBe(false);
    expect(isCopyableLicense(undefined)).toBe(false);
  });
});
