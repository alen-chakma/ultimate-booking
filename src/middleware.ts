import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ADMIN_PATTERN = /^\/[^/]+\/admin(\/.*)?$/;
const PROTECTED_BOOKING_PATTERN = /^\/[^/]+\/bookings(\/.*)?$/;
const ONBOARDING_PATH = "/onboarding";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session");

  // Admin routes require authentication (enforced via session cookie)
  if (PROTECTED_ADMIN_PATTERN.test(pathname)) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Booking management routes require auth
  if (PROTECTED_BOOKING_PATTERN.test(pathname)) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Onboarding requires auth
  if (pathname === ONBOARDING_PATH || pathname.startsWith(ONBOARDING_PATH + "/")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", ONBOARDING_PATH);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
