import { describe, expect, it } from "vitest";
import { getUploadBatchActivityTitle } from "@/server/repositories/files";

describe("batch upload", () => {
  it("uses one activity title for multiple uploaded files", () => {
    expect(getUploadBatchActivityTitle(["README.md", "src/app.ts"], 0)).toBe("Uploaded 2 files");
  });

  it("keeps single file activity readable", () => {
    expect(getUploadBatchActivityTitle(["README.md"], 0)).toBe("File uploaded: README.md");
    expect(getUploadBatchActivityTitle(["README.md"], 1)).toBe("File updated: README.md");
  });
});
