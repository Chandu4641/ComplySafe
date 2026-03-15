import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "cs_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  if (!isLocalhost && forwardedProto !== "https") {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl);
  }

  // Add HSTS header for production
  const response = NextResponse.next();
  if (!isLocalhost) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  return response;

  // Check if path requires authentication
  const protectedPaths = [
    "/dashboard",
    "/controls",
    "/evidence",
    "/readiness",
    "/frameworks",
    "/integrations",
    "/onboarding",
    "/copilot",
    "/regulatory"
  ];
  
  // Public paths that don't require authentication
  const publicPaths = [
    "/login",
    "/api/auth/login",
    "/api/auth/logout",
    "/"
  ];
  
  // Check if path is explicitly public
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + "/"));
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  const requiresAuth = protectedPaths.some(path => pathname.startsWith(path));
  if (!requiresAuth) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/controls/:path*",
    "/evidence/:path*",
    "/readiness/:path*",
    "/frameworks/:path*",
    "/integrations/:path*",
    "/onboarding",
    "/copilot/:path*",
    "/regulatory/:path*"
  ]
};
