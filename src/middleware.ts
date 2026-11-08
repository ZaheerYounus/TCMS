import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Whitelist public assets and auth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/eng.traineddata") ||
    pathname === "/favicon.ico" ||
    pathname === "/login" ||
    pathname === "/api/auth/login"
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const token = req.cookies.get("tcms_session")?.value;
  const user = token ? await verifySessionToken(token) : null;

  // 3. If unauthenticated
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required. Please login with your user ID and password." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Admin-only path guards
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (user.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Access denied. Administrator privileges required." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
