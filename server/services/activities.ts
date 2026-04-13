import { ActivityType, AuditAction, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type { CreateActivityInput } from "@/lib/validators/activity";
import { writeAudit } from "@/server/services/audit";

type Ctx = { actor: SessionUser; ip?: string; userAgent?: string };

export async function logActivity(input: CreateActivityInput, ctx: Ctx) {
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, deletedAt: null },
    select: { id: true, ownerId: true },
  });
  if (!client) throw new NotFoundError("Client not found");
  if (ctx.actor.role === UserRole.ASSOCIATE && client.ownerId !== ctx.actor.id) {
    throw new ForbiddenError("You do not have access to this client");
  }

  return prisma.$transaction(async (tx) => {
    const activity = await tx.activity.create({
      data: {
        type: input.type,
        clientId: input.clientId,
        actorId: ctx.actor.id,
        summary: input.summary,
        body: input.body,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      },
    });
    await tx.client.update({
      where: { id: input.clientId },
      data: { lastContactAt: activity.occurredAt },
    });
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.CREATE,
        entityType: "activity",
        entityId: activity.id,
        after: activity,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );
    return activity;
  });
}

export async function listActivitiesForClient(clientId: string, limit = 50) {
  return prisma.activity.findMany({
    where: { clientId, deletedAt: null },
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: { actor: { select: { id: true, name: true } } },
  });
}

export { ActivityType };
