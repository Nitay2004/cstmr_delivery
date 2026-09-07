import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUserFromToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isPublicPage = pathname === "/login" || pathname === "/register";
  const isAuthApi = pathname.startsWith("/api/auth/");

  if (isAuthApi) {
    return NextResponse.next();
  }

  const user = token ? await getCurrentUserFromToken(token) : null;

  if (isPublicPage) {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/users")) {
    if (!user.permissions.manageUsers) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$).*)",
  ],
};