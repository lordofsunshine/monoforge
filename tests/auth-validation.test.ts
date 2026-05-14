import { describe, expect, it } from "vitest";
import { loginSchema, profileSettingsSchema, registerSchema, usernameSchema } from "@/lib/validation/auth";

describe("auth validation", () => {
  it("normalizes valid usernames to lowercase", () => {
    expect(usernameSchema.parse("Mono_Forge-01")).toBe("mono_forge-01");
  });

  it("rejects usernames outside the safe pattern", () => {
    expect(usernameSchema.safeParse("mono forge").success).toBe(false);
    expect(usernameSchema.safeParse("моно").success).toBe(false);
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("-mono").success).toBe(false);
    expect(usernameSchema.safeParse("mono-").success).toBe(false);
  });

  it("validates registration input", () => {
    const parsed = registerSchema.safeParse({
      email: "USER@EXAMPLE.COM",
      username: "mono_user",
      password: "password123",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success ? parsed.data.email : "").toBe("user@example.com");
  });

  it("requires a password for login", () => {
    expect(
      loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      }).success,
    ).toBe(false);
  });

  it("allows empty optional profile fields", () => {
    expect(
      profileSettingsSchema.safeParse({
        username: "mono_user",
        bio: "",
        image: "",
      }).success,
    ).toBe(true);
  });
});
