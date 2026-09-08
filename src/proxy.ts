import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUserFromToken } from "@/lib/auth";

function getBaseUrl(request: NextRequest): string {
  const protocol =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol ?? "http";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  return `${protocol}://${host}`;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const baseUrl = getBaseUrl(request);
  const token = request.cookies.get("token")?.value;

  const isPublicPage = pathname === "/login" || pathname === "/register";
  const isAuthApi = pathname.startsWith("/api/auth/");

  if (isAuthApi) {
    return NextResponse.next();
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/pickup-request", baseUrl));
  }

  const user = token ? await getCurrentUserFromToken(token) : null;

  if (isPublicPage) {
    if (user) {
      return NextResponse.redirect(new URL("/pickup-request", baseUrl));
    }
    return NextResponse.next();
  }

  if (!user) {
    const loginUrl = new URL("/login", baseUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/users")) {
    if (!user.permissions.manageUsers) {
      return NextResponse.redirect(new URL("/pickup-request", baseUrl));
    }
  }

  if (
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/purchase-orders") ||
    pathname.startsWith("/payments")
  ) {
    const perm = pathname.startsWith("/quotes")
      ? "viewQuotes"
      : pathname.startsWith("/purchase-orders")
        ? "viewPurchaseOrders"
        : "viewPayments";
    if (!user.permissions[perm as keyof typeof user.permissions]) {
      return NextResponse.redirect(new URL("/pickup-request", baseUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$).*)",
  ],
};