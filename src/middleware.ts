import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

// Uses the Edge-safe config (no bcryptjs/Prisma) so middleware doesn't
// bundle Node-only code into the Edge runtime.
const { auth } = NextAuth(authConfig);

const OWNER_ROUTE_PREFIXES = ["/owner", "/api/facility", "/api/courts", "/api/dashboard"];
const PLAYER_ROUTE_PREFIXES = ["/reservations", "/api/bookings"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isOwnerRoute = OWNER_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isPlayerRoute = PLAYER_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isOwnerRoute && !isPlayerRoute) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isOwnerRoute && session.user.role !== "COURT_OWNER") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (isPlayerRoute && session.user.role !== "PLAYER") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/owner/:path*",
    "/reservations/:path*",
    "/api/facility/:path*",
    "/api/courts/:path*",
    "/api/dashboard/:path*",
    "/api/bookings/:path*",
  ],
};
