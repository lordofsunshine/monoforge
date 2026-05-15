export function isSameOriginRequest(request: Request) {
  const method = request.method.toUpperCase();

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "");

  if (!origin || !host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host && originUrl.protocol.replace(":", "") === proto;
  } catch {
    return false;
  }
}

export function hasApiCredential(request: Request) {
  const authorization = request.headers.get("authorization");
  return Boolean(authorization?.toLowerCase().startsWith("bearer ") || request.headers.get("x-api-key"));
}
