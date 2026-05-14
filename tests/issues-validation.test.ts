import { describe, expect, it } from "vitest";
import { createIssueDigest, createIssueSchema, issueFiltersSchema } from "@/lib/validation/issues";

describe("issue validation", () => {
  it("validates issue creation with labels and source line", () => {
    const parsed = createIssueSchema.safeParse({
      title: "Fix README preview",
      body: "The markdown table spacing is off.",
      priority: "HIGH",
      boardStatus: "TODO",
      labels: ["bug", "docs"],
      sourcePath: "README.md",
      sourceLine: "12",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success ? parsed.data.sourceLine : 0).toBe(12);
  });

  it("rejects unsafe label slugs", () => {
    expect(
      createIssueSchema.safeParse({
        title: "Unsafe label",
        labels: ["../../bad"],
      }).success,
    ).toBe(false);
  });

  it("normalizes issue filters", () => {
    const parsed = issueFiltersSchema.parse({
      status: "closed",
      sort: "oldest",
      author: "ADMIN",
    });

    expect(parsed.author).toBe("admin");
  });

  it("creates a one-line digest", () => {
    expect(createIssueDigest("Title", "Body\nwith   spacing")).toBe("Title. Body with spacing");
  });
});
