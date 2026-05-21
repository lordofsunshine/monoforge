import { NextResponse, type NextRequest } from "next/server";
import { hasApiCredential, isSameOriginRequest } from "@/lib/security/origin";

function createNonce() {
  return btoa(crypto.randomUUID());
}

function createContentSecurityPolicy(nonce: string) {
  const scriptSrc = process.env.NODE_ENV === "development" ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : `script-src 'self' 'nonce-${nonce}'`;
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' https: data:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    "connect-src 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function withSecurityHeaders(response: NextResponse, nonce: string) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", createContentSecurityPolicy(nonce));
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", createContentSecurityPolicy(nonce));

  if (request.headers.has("x-middleware-subrequest")) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/", request.url)), nonce);
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/") && !isSameOriginRequest(request) && !hasApiCredential(request)) {
    return withSecurityHeaders(NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 }), nonce);
  }

  const response = withSecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    nonce,
  );
  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
