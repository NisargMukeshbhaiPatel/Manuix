import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { LOGIN, REGISTER, DASHBOARD } from "@/constants/page-routes";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token?.id;

  const path = req.nextUrl.pathname;
  const isAuthPage = path === LOGIN || path === REGISTER || path === "/activate";

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DASHBOARD, req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const requestedUrl = path + req.nextUrl.search;
    return requestedUrl === DASHBOARD
      ? NextResponse.redirect(new URL(LOGIN, req.url))
      : NextResponse.redirect(
          new URL(
            `${LOGIN}?redirect=${encodeURIComponent(requestedUrl)}`,
            req.url,
          ),
        );
  }

  //Admin route protection?
  // if (path.startsWith("/admin") && token?.role !== "admin") {
  //   return NextResponse.redirect(new URL("/unauthorized", req.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
