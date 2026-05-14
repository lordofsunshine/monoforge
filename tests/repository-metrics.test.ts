import { describe, expect, it } from "vitest";
import { calculateStorageDisciplineScore } from "@/server/repositories/metrics";

describe("repository metrics", () => {
  it("rewards clean repositories with readme and compression savings", () => {
    const score = calculateStorageDisciplineScore({
      fileCount: 80,
      compressionSavedPercent: 35,
      hasReadme: true,
      largeFileCount: 0,
      openIssues: 1,
      closedIssues: 9,
    });

    expect(score).toBeGreaterThanOrEqual(95);
  });

  it("penalizes heavy repositories with no readme and large files", () => {
    const score = calculateStorageDisciplineScore({
      fileCount: 950,
      compressionSavedPercent: 0,
      hasReadme: false,
      largeFileCount: 5,
      openIssues: 10,
      closedIssues: 0,
    });

    expect(score).toBe(0);
  });
});
