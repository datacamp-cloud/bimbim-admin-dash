import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "bimbim_admin_session";

function base64UrlToUint8Array(value: string): Uint8Array {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function stringToUint8Array(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(value.byteLength);
  new Uint8Array(buffer).set(value);
  return buffer;
}

async function validSession(token: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32 || !token) {
    return false;
  }

  const [value, signature] = token.split(".");

  if (!value || !signature) {
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      toArrayBuffer(stringToUint8Array(secret)),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      key,
      toArrayBuffer(stringToUint8Array(value)),
    );

    const expectedBytes = new Uint8Array(expectedSignature);
    const actualBytes = base64UrlToUint8Array(signature);

    if (actualBytes.length !== expectedBytes.length) {
      return false;
    }

    let difference = 0;

    for (let i = 0; i < expectedBytes.length; i++) {
      difference |= expectedBytes[i] ^ actualBytes[i];
    }

    if (difference !== 0) {
      return false;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToUint8Array(value)),
    );

    return Number(payload?.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    path === "/admin/login" ||
    path.startsWith("/_next/") ||
    path === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isProtectedPage =
    path === "/dashboard" ||
    path.startsWith("/users") ||
    path.startsWith("/couriers") ||
    path.startsWith("/deliveries") ||
    path.startsWith("/settings") ||
    path.startsWith("/notifications");

  const isProtectedApi = path.startsWith("/api/admin/");

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const sessionValid = await validSession(
    request.cookies.get(COOKIE_NAME)?.value,
  );

  if (sessionValid) {
    return NextResponse.next();
  }

  if (isProtectedApi) {
    return NextResponse.json(
      {
        error: "Authentification administrateur requise.",
      },
      {
        status: 401,
      },
    );
  }

  const loginUrl = new URL("/admin/login", request.url);

  loginUrl.searchParams.set(
    "next",
    path + request.nextUrl.search,
  );

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