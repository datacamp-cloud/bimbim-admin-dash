import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "bimbim_admin_session";

function validSession(token: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32 || !token) return false;

  const [value, signature] = token.split(".");
  if (!value || !signature) return false;

  const expected = createHmac("sha256", secret).update(value).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return Number(payload?.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/admin/login" || path.startsWith("/_next/") || path === "/favicon.ico") {
    return NextResponse.next();
  }

  const isProtectedPage = path === "/dashboard" || path.startsWith("/users") ||
    path.startsWith("/couriers") || path.startsWith("/deliveries") ||
    path.startsWith("/settings") || path.startsWith("/notifications");

  const isProtectedApi = path.startsWith("/api/admin/");

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next();

  if (validSession(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.next();
  }

  if (isProtectedApi) {
    return NextResponse.json({ error: "Authentification administrateur requise." }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", path + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/couriers/:path*",
    "/deliveries/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/api/admin/:path*",
  ],
};
