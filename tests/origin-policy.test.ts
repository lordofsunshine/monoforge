import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/security/origin";

describe("origin policy", () => {
  it("allows safe read methods without origin", () => {
    const request = new Request("http://localhost:3000/api/search");
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("allows same-origin mutations", () => {
    const request = new Request("http://localhost:3000/api/repositories", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        host: "localhost:3000",
      },
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("blocks cross-origin mutations", () => {
    const request = new Request("http://localhost:3000/api/repositories", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        host: "localhost:3000",
      },
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("blocks mutation requests with missing origin", () => {
    const request = new Request("http://localhost:3000/api/repositories", {
      method: "POST",
      headers: {
        host: "localhost:3000",
      },
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });
});
