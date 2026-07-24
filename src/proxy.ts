import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

const PUBLIC_PATHS = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/verify",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-otp",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/webhooks",
  "/api/repositories",
  "/api/checks",
  "/api/usage",
  "/api/admin",
  "/api/team",
  "/_next",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/onboarding") return true;
  for (const path of PUBLIC_PATHS) {
    if (pathname === path || pathname.startsWith(path + "/")) return true;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ms-token")?.value;

  if (!token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId as string);
    requestHeaders.set("x-user-email", payload.email as string);
    requestHeaders.set("x-user-role", payload.role as string);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    const response = NextResponse.redirect(new URL("/auth/signin", request.url));
    response.cookies.delete("ms-token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
