import { NextResponse, type NextRequest } from "next/server";

import { AUTH_TOKEN_COOKIE } from "@/lib/auth-cookie";

const authPublicRoutes = ["/login", "/register", "/forget-password"];
const alwaysPublicRoutes = ["/politica-de-privacidade"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isAuthPublic = matchesRoute(pathname, authPublicRoutes);
  const isAlwaysPublic = matchesRoute(pathname, alwaysPublicRoutes);

  if (isAlwaysPublic) {
    return NextResponse.next();
  }

  if (!token && !isAuthPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPublic) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
