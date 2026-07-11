import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Next.js Middleware — Auth Guard
//
// Checks for the JWT cookie (resumerank_token).
// Unauthenticated requests to protected routes → redirect /login.
// Already-authenticated requests to /login|/register → redirect /jobs.
// ============================================================

const COOKIE_NAME = "resumerank_token";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/jobs", "/dashboard"];

// Routes that should redirect to /jobs if already authenticated
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME);
  const isAuthenticated = !!token?.value;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/jobs", req.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (
    !isAuthenticated &&
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
