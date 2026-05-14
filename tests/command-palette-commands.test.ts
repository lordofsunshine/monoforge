import { describe, expect, it } from "vitest";
import { filterCommands, getBaseCommands, getRepoContext } from "@/components/command-palette/commands";

describe("command palette commands", () => {
  it("detects repository context from content routes", () => {
    expect(getRepoContext("/alice/mono")).toEqual({ owner: "alice", repo: "mono" });
    expect(getRepoContext("/dashboard")).toBeNull();
    expect(getRepoContext("/u/alice")).toBeNull();
  });

  it("builds repo-aware shortcuts", () => {
    const commands = getBaseCommands({
      username: "alice",
      repoContext: { owner: "alice", repo: "mono" },
    });

    expect(commands.find((command) => command.id === "issue:new")?.href).toBe("/alice/mono/issues/new");
    expect(commands.find((command) => command.id === "repo:download-zip")?.href).toBe("/api/repositories/alice/mono/archive");
  });

  it("matches short commands", () => {
    const commands = getBaseCommands({ username: "alice" });

    expect(filterCommands(commands, "repo:new").map((command) => command.id)).toContain("repo:new");
    expect(filterCommands(commands, "theme:toggle").map((command) => command.id)).toEqual(["theme:toggle"]);
  });
});
