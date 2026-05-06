import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/my-courses", "/course-player", "/test-attempt", "/results"];

export function middleware(request: NextRequest) {
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.get("nidus_auth")?.value === "1";

  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/my-courses/:path*", "/course-player/:path*", "/test-attempt/:path*", "/results/:path*"]
};
