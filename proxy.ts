import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest } from "@/lib/security/origin";

function withSecurityHeaders(response: NextResponse) {
  const scriptSrc = process.env.NODE_ENV === "development" ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
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
    ].join("; "),
  );
  return response;
}

export async function proxy(request: NextRequest) {
  if (request.headers.has("x-middleware-subrequest")) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/") && !isSameOriginRequest(request)) {
    return withSecurityHeaders(NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 }));
  }

  const response = withSecurityHeaders(NextResponse.next());
  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
