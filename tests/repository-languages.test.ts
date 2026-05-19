import { describe, expect, it } from "vitest";
import { calculateRepositoryLanguages } from "@/server/repositories/languages";

describe("repository language stats", () => {
  it("groups language sizes and returns percentages", () => {
    const languages = calculateRepositoryLanguages([
      { language: "ts", size: 300n },
      { language: "ts", size: 100n },
      { language: "css", size: 100n },
      { language: "markdown", size: 100n },
      { language: null, size: 999n },
    ]);

    expect(languages.map((item) => item.language)).toEqual(["TypeScript", "CSS", "Markdown"]);
    expect(languages[0].percent).toBeGreaterThan(60);
    expect(languages.reduce((sum, item) => sum + item.percent, 0)).toBe(100);
  });
});
