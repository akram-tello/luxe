import type { NextRequest } from "next/server";
import { readSession, type SessionUser } from "@/lib/auth/session";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { clientIp } from "@/lib/utils/rateLimit";
import type { UserRole } from "@prisma/client";

export type RouteContext = {
  actor: SessionUser;
  ip: string;
  userAgent: string;
};

export async function authedContext(req: NextRequest): Promise<RouteContext> {
  const actor = await readSession();
  if (!actor) throw new UnauthorizedError();
  return {
    actor,
    ip: clientIp(req.headers),
    userAgent: req.headers.get("user-agent") ?? "",
  };
}

export async function managerContext(req: NextRequest): Promise<RouteContext> {
  const ctx = await authedContext(req);
  if (ctx.actor.role !== ("MANAGER" as UserRole)) throw new ForbiddenError();
  return ctx;
}
