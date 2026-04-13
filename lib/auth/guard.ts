import { redirect } from "next/navigation";
import { readSession, type SessionUser } from "@/lib/auth/session";
import type { UserRole } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export async function requireUser(): Promise<SessionUser> {
  const user = await readSession();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(role: UserRole | UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) throw new ForbiddenError();
  return user;
}

export async function requireManager(): Promise<SessionUser> {
  return requireRole("MANAGER");
}

export async function requireUserForPage(): Promise<SessionUser> {
  const user = await readSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireManagerForPage(): Promise<SessionUser> {
  const user = await requireUserForPage();
  if (user.role !== "MANAGER") redirect("/associate");
  return user;
}
