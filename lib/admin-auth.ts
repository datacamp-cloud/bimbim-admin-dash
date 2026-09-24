import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bimbim_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  sub: number;
  login: string;
  nom: string;
  role: "super_admin" | "support" | "moderateur";
  exp: number;
};

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createAdminSession(payload: Omit<AdminSessionPayload, "exp">) {
  const value = encode(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    }),
  );
  return `${value}.${sign(value)}`;
}

export function verifyAdminSession(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null;

  const [value, signature] = token.split(".");
  if (!value || !signature) return null;

  const expected = sign(value);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(value)) as AdminSessionPayload;
    if (!payload.sub || !payload.login || !payload.role || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const store = await cookies();
  return verifyAdminSession(store.get(COOKIE_NAME)?.value);
}

export const adminSessionCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_TTL_SECONDS,
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
