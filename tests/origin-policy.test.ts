import { afterEach, describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/security/origin";

describe("origin policy", () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY_HEADERS;
  });

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

  it("does not trust spoofed forwarded host headers by default", () => {
    const request = new Request("https://monoforge.org/api/repositories", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        host: "monoforge.org",
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      },
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("uses trusted forwarded protocol without trusting forwarded host", () => {
    process.env.TRUST_PROXY_HEADERS = "true";

    const request = new Request("http://monoforge.org/api/repositories", {
      method: "POST",
      headers: {
        origin: "https://monoforge.org",
        host: "monoforge.org",
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      },
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });
});
