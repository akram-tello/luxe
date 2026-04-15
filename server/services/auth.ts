import { AuditAction, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  createPreAuth,
  setPreAuthCookie,
  clearPreAuthCookie,
  readPreAuth,
  type SessionUser,
  type PreAuthPayload,
} from "@/lib/auth/session";
import { generateSecret, verifyCode } from "@/lib/auth/totp";
import {
  UnauthorizedError,
  BusinessRuleError,
  ForbiddenError,
} from "@/lib/errors";
import { writeAudit } from "@/server/services/audit";
import type { LoginInput } from "@/lib/validators/auth";

type Ctx = { ip?: string; userAgent?: string };

// Step 1 of login: validate email+password, issue a pre-auth cookie, and
// tell the caller which TOTP step to send the user to. A full session is
// NEVER issued here — the user must complete TOTP first.
export type LoginStep1Result = {
  stage: "enroll" | "verify";
};

export async function loginStep1(
  input: LoginInput,
  ctx: Ctx,
): Promise<LoginStep1Result> {
  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null, active: true },
  });
  if (!user) throw new UnauthorizedError("Invalid credentials");
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid credentials");

  const stage: "enroll" | "verify" =
    user.totpSecret && user.totpEnabledAt ? "verify" : "enroll";

  // If we're about to enroll, generate the secret now so the user sees a
  // stable QR across a refresh within the pre-auth window. We only persist
  // it after the user confirms a valid code (see confirmEnrollment).
  if (stage === "enroll" && !user.totpSecret) {
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: generateSecret() },
    });
  }

  const payload: PreAuthPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    stage,
  };
  const token = await createPreAuth(payload);
  await setPreAuthCookie(token);

  return { stage };
}

async function issueFullSession(
  userId: string,
  ctx: Ctx,
): Promise<SessionUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt || !user.active) {
    throw new UnauthorizedError("Account unavailable");
  }
  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const token = await createSession(session);
  await setSessionCookie(token);
  await clearPreAuthCookie();
  await writeAudit({
    actorId: user.id,
    action: AuditAction.LOGIN,
    entityType: "user",
    entityId: user.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return session;
}

// Step 2a: confirm enrollment — the user has just scanned their QR and
// entered a valid code. We lock the secret in (`totpEnabledAt = now()`)
// and issue the real session.
export async function confirmEnrollment(code: string, ctx: Ctx): Promise<SessionUser> {
  const pre = await readPreAuth();
  if (!pre || pre.stage !== "enroll") throw new UnauthorizedError("Session expired");
  const user = await prisma.user.findUnique({ where: { id: pre.userId } });
  if (!user || !user.totpSecret) throw new UnauthorizedError("Session expired");
  if (!verifyCode(user.totpSecret, code)) {
    throw new BusinessRuleError("Invalid code. Check the time on your device and try again.");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabledAt: new Date() },
  });
  return issueFullSession(user.id, ctx);
}

// Step 2b: verify — user has 2FA already; just check the code.
export async function verifyLoginCode(code: string, ctx: Ctx): Promise<SessionUser> {
  const pre = await readPreAuth();
  if (!pre || pre.stage !== "verify") throw new UnauthorizedError("Session expired");
  const user = await prisma.user.findUnique({ where: { id: pre.userId } });
  if (!user || !user.totpSecret || !user.totpEnabledAt) {
    throw new UnauthorizedError("Session expired");
  }
  if (!verifyCode(user.totpSecret, code)) {
    throw new BusinessRuleError("Invalid code. Try again.");
  }
  return issueFullSession(user.id, ctx);
}

export async function logout(actor: SessionUser | null, ctx: Ctx): Promise<void> {
  await clearSessionCookie();
  await clearPreAuthCookie();
  if (actor) {
    await writeAudit({
      actorId: actor.id,
      action: AuditAction.LOGOUT,
      entityType: "user",
      entityId: actor.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }
}

// A manager may only invite associates once their own 2FA is confirmed.
// The guard is checked here so every call site stays honest.
export async function assertManagerWith2FA(actor: SessionUser): Promise<void> {
  if (actor.role !== UserRole.MANAGER) {
    throw new ForbiddenError("Only managers may invite users");
  }
  const fresh = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { totpEnabledAt: true },
  });
  if (!fresh?.totpEnabledAt) {
    throw new ForbiddenError(
      "Enable two-factor authentication on your account before inviting associates.",
    );
  }
}

export async function listAssignableUsers(actor: SessionUser) {
  if (actor.role === UserRole.MANAGER) {
    return prisma.user.findMany({
      where: { active: true, deletedAt: null },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
  }
  const self = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { id: true, name: true, email: true, role: true },
  });
  return self ? [self] : [];
}
