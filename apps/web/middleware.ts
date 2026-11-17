import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get("pp_refresh")?.value;

  if (!refreshToken) {
    const loginUrl = new URL("/login", request.url);
    const target = request.nextUrl.pathname + request.nextUrl.search;
    loginUrl.searchParams.set("next", target);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/reports/:path*", "/moderation/:path*", "/organization/:path*"],
};
