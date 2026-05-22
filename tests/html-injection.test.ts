import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("html injection boundaries", () => {
  it("does not use direct inner html in the code viewer or root layout path", () => {
    const files = [
      "components/repository/code-viewer.tsx",
      "components/system/preference-script.tsx",
      "app/layout.tsx",
      "app/[owner]/[repo]/page.tsx",
    ];

    for (const file of files) {
      expect(readFileSync(file, "utf8")).not.toContain("dangerouslySetInnerHTML");
    }
  });
});
