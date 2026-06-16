import { describe, expect, it, vi } from "vitest";

const { mirrored } = vi.hoisted(() => ({ mirrored: new Set<string>() }));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    mirroredRepository: {
      findUnique: async ({ where }: { where: { githubId: bigint } }) => (mirrored.has(where.githubId.toString()) ? { id: "x" } : null),
    },
  }),
}));

import { hasMirrored } from "@/server/mirror/settings";

describe("mirror dedup", () => {
  it("treats known GitHub repository ids as already mirrored", async () => {
    mirrored.add("123");

    expect(await hasMirrored(123)).toBe(true);
    expect(await hasMirrored(999)).toBe(false);
  });

  it("handles large GitHub ids", async () => {
    mirrored.add("1234567890");

    expect(await hasMirrored(1234567890)).toBe(true);
  });
});
