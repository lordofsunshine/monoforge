import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/admin";

describe("admin access", () => {
  it("allows configured admin email", () => {
    const previous = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@example.com";

    expect(isAdminEmail("admin@example.com")).toBe(true);

    if (previous === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = previous;
    }
  });

  it("rejects non-admin email", () => {
    expect(isAdminEmail("user@example.com")).toBe(false);
  });
});
