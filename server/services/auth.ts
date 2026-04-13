import { AuditAction, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie, clearSessionCookie, type SessionUser } from "@/lib/auth/session";
import { UnauthorizedError, BusinessRuleError, ForbiddenError } from "@/lib/errors";
import { writeAudit } from "@/server/services/audit";
import type { CreateUserInput, LoginInput } from "@/lib/validators/auth";

type Ctx = { ip?: string; userAgent?: string };

export async function login(input: LoginInput, ctx: Ctx): Promise<SessionUser> {
  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null, active: true },
  });
  if (!user) throw new UnauthorizedError("Invalid credentials");
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid credentials");

  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const token = await createSession(session);
  await setSessionCookie(token);

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

export async function logout(actor: SessionUser | null, ctx: Ctx): Promise<void> {
  await clearSessionCookie();
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

export async function createUser(input: CreateUserInput, actor: SessionUser, ctx: Ctx) {
  if (actor.role !== UserRole.MANAGER) throw new ForbiddenError("Only managers may create users");
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new BusinessRuleError("A user with this email already exists");
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
    },
  });
  await writeAudit({
    actorId: actor.id,
    action: AuditAction.CREATE,
    entityType: "user",
    entityId: user.id,
    after: { id: user.id, email: user.email, role: user.role },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
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
