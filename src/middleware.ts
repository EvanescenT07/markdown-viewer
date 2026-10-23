import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth/jwt";

const PROTECTED_PAGE_PREFIXES = ["/dashboard", "/read"];
const PROTECTED_API_PREFIXES = ["/api/documents"];
const AUTH_GUEST_PAGES = ["/login", "/register"];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isProtectedApi = PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isGuestAuthPage = AUTH_GUEST_PAGES.includes(pathname);

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const sessionResult = token ? await verifySessionToken(token) : null;
  const isAuthenticated = Boolean(sessionResult?.isSuccess);

  if (isProtectedApi && !isAuthenticated) {
    return NextResponse.json(
      {
        code: "UNAUTHORIZED",
        message: "Authentication required to access document resources.",
      },
      { status: 401 }
    );
  }

  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/read/:path*",
    "/api/documents/:path*",
    "/login",
    "/register",
  ],
};

