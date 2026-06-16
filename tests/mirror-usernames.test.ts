import { describe, expect, it } from "vitest";
import { usernameSchema } from "@/lib/validation/auth";
import { githubLoginToUsername, usernameWithSuffix } from "@/server/mirror/usernames";

describe("mirror usernames", () => {
  it("normalizes GitHub logins into valid MonoForge usernames", () => {
    expect(githubLoginToUsername("Octocat")).toBe("octocat");
    expect(githubLoginToUsername("John.Doe")).toBe("john-doe");
    expect(githubLoginToUsername("--weird--")).toBe("weird");
    expect(githubLoginToUsername("a_b")).toBe("a_b");
  });

  it("pads short logins and truncates long ones", () => {
    expect(githubLoginToUsername("a")).toHaveLength(3);
    const long = githubLoginToUsername("a".repeat(60));
    expect(long.length).toBeLessThanOrEqual(32);
  });

  it("produces schema-valid usernames", () => {
    for (const login of ["Octocat", "a", "John.Doe", "--weird--", "x".repeat(50)]) {
      expect(usernameSchema.safeParse(githubLoginToUsername(login)).success).toBe(true);
    }
  });

  it("builds collision suffixes that stay valid and bounded", () => {
    expect(usernameWithSuffix("octocat", 0)).toBe("octocat");
    expect(usernameWithSuffix("octocat", 2)).toBe("octocat-2");
    const suffixed = usernameWithSuffix("x".repeat(32), 12);
    expect(suffixed.length).toBeLessThanOrEqual(32);
    expect(usernameSchema.safeParse(suffixed).success).toBe(true);
  });
});
