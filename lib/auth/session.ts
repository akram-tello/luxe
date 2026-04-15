import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

const COOKIE_NAME = "luxe_session";
const PRE_AUTH_COOKIE = "luxe_preauth";
// A short TTL is fine: the user is expected to type a code immediately.
// Long enough to tolerate fumbling, short enough to limit exposure if
// the browser is left unattended between steps.
const PRE_AUTH_TTL = 5 * 60; // 5 minutes

export type PreAuthPayload = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  // "enroll" — user has no totpSecret yet; must scan QR and confirm code.
  // "verify" — user has a confirmed secret; must enter a code to finalise.
  stage: "enroll" | "verify";
};

function secret(): Uint8Array {
  return new TextEncoder().encode(env().AUTH_SECRET);
}

export async function createSession(user: SessionUser): Promise<string> {
  const ttl = env().AUTH_SESSION_TTL;
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .setSubject(user.id)
    .setIssuer("luxe-crm")
    .setAudience("luxe-crm-web")
    .sign(secret());
  return token;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "luxe-crm",
      audience: "luxe-crm-web",
    });
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name ?? ""),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const ttl = env().AUTH_SESSION_TTL;
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });
}

export async function clearSessionCookie(): Promise<void> {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const SESSION_COOKIE = COOKIE_NAME;
export const PRE_AUTH_COOKIE_NAME = PRE_AUTH_COOKIE;

export async function createPreAuth(payload: PreAuthPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PRE_AUTH_TTL}s`)
    .setSubject(payload.userId)
    .setIssuer("luxe-crm")
    .setAudience("luxe-crm-preauth")
    .sign(secret());
  return token;
}

export async function setPreAuthCookie(token: string): Promise<void> {
  cookies().set(PRE_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PRE_AUTH_TTL,
  });
}

export async function clearPreAuthCookie(): Promise<void> {
  cookies().set(PRE_AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readPreAuth(): Promise<PreAuthPayload | null> {
  const token = cookies().get(PRE_AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "luxe-crm",
      audience: "luxe-crm-preauth",
    });
    if (!payload.sub || !payload.email || !payload.role || !payload.stage) return null;
    return {
      userId: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name ?? ""),
      role: payload.role as UserRole,
      stage: payload.stage as "enroll" | "verify",
    };
  } catch {
    return null;
  }
}
