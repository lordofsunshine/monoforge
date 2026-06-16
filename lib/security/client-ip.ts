type HeaderReader = {
  get(name: string): string | null;
};

export function getClientIpFromHeaders(headers: HeaderReader): string {
  const trustProxy = process.env.TRUST_PROXY_HEADERS === "true";

  if (!trustProxy) {
    return "unknown";
  }

  const realIp = headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  const forwarded = headers.get("x-forwarded-for");

  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const rightmost = parts[parts.length - 1];

    if (rightmost) {
      return rightmost;
    }
  }

  return "unknown";
}
