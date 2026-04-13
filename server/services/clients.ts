import { ActivityType, AuditAction, ClientTier, NotificationType, PipelineStage, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BusinessRuleError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type { CreateClientInput, ReassignClientInput, UpdateClientInput } from "@/lib/validators/client";
import { normalizePhone } from "@/lib/utils/phone";
import { diffObjects } from "@/lib/utils/diff";
import { writeAudit } from "@/server/services/audit";
import { notifyUser } from "@/server/services/notifications";

type Ctx = { actor: SessionUser; ip?: string; userAgent?: string };

function toDate(value: string | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createClient(input: CreateClientInput, ctx: Ctx) {
  if (ctx.actor.role === UserRole.ASSOCIATE && input.ownerId !== ctx.actor.id) {
    throw new ForbiddenError("Associates may only create clients assigned to themselves");
  }

  const owner = await prisma.user.findFirst({
    where: { id: input.ownerId, deletedAt: null, active: true },
    select: { id: true, name: true, role: true },
  });
  if (!owner) throw new BusinessRuleError("Assigned owner does not exist or is inactive");

  const created = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name: input.name,
        phone: normalizePhone(input.phone),
        email: input.email,
        tier: input.tier ?? ClientTier.STANDARD,
        ownerId: input.ownerId,
        birthday: input.birthday ? new Date(input.birthday) : null,
        anniversary: input.anniversary ? new Date(input.anniversary) : null,
        notes: input.notes,
        wishlist: input.wishlist ? (input.wishlist as Prisma.InputJsonValue) : Prisma.JsonNull,
        collection: input.collection ? (input.collection as Prisma.InputJsonValue) : Prisma.JsonNull,
        stage: PipelineStage.PROSPECT,
      },
    });

    await tx.pipelineState.create({
      data: {
        clientId: client.id,
        stage: PipelineStage.PROSPECT,
        fromStage: null,
        note: "Client created — initial stage",
        changedById: ctx.actor.id,
      },
    });

    await tx.activity.create({
      data: {
        type: ActivityType.SYSTEM,
        clientId: client.id,
        actorId: ctx.actor.id,
        summary: "Client created",
        body: `Created by ${ctx.actor.name} and assigned to ${owner.name}`,
      },
    });

    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.CREATE,
        entityType: "client",
        entityId: client.id,
        after: client,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );

    if (owner.id !== ctx.actor.id) {
      await notifyUser(
        {
          userId: owner.id,
          type: NotificationType.CLIENT_ASSIGNED,
          title: "New client assigned",
          body: `${client.name} has been assigned to you by ${ctx.actor.name}.`,
          link: `/clients/${client.id}`,
        },
        tx,
      );
    }

    return client;
  });

  return created;
}

export async function updateClient(id: string, input: UpdateClientInput, ctx: Ctx) {
  const existing = await prisma.client.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError("Client not found");
  if (ctx.actor.role === UserRole.ASSOCIATE && existing.ownerId !== ctx.actor.id) {
    throw new ForbiddenError("You do not have access to this client");
  }
  if (input.ownerId !== undefined && input.ownerId !== existing.ownerId) {
    throw new BusinessRuleError("Use the reassignment endpoint to change client ownership");
  }
  if (input.stage !== undefined) {
    throw new BusinessRuleError("Use the pipeline endpoint to change stage");
  }

  const data: Prisma.ClientUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = normalizePhone(input.phone);
  if (input.email !== undefined) data.email = input.email ?? null;
  if (input.tier !== undefined) data.tier = input.tier;
  if (input.notes !== undefined) data.notes = input.notes ?? null;
  const birthday = toDate(input.birthday);
  if (birthday !== undefined) data.birthday = birthday;
  const anniv = toDate(input.anniversary);
  if (anniv !== undefined) data.anniversary = anniv;
  if (input.wishlist !== undefined) data.wishlist = input.wishlist as Prisma.InputJsonValue;
  if (input.collection !== undefined) data.collection = input.collection as Prisma.InputJsonValue;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({ where: { id }, data });
    const diff = diffObjects(existing as Record<string, unknown>, updated as Record<string, unknown>);
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.UPDATE,
        entityType: "client",
        entityId: id,
        before: diff?.before,
        after: diff?.after,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );
    await tx.activity.create({
      data: {
        type: ActivityType.SYSTEM,
        clientId: id,
        actorId: ctx.actor.id,
        summary: "Client details updated",
        metadata: diff ? (diff as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
    return updated;
  });
}

export async function softDeleteClient(id: string, ctx: Ctx) {
  if (ctx.actor.role !== UserRole.MANAGER) {
    throw new ForbiddenError("Only managers may archive clients");
  }
  const existing = await prisma.client.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError("Client not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.DELETE,
        entityType: "client",
        entityId: id,
        before: existing,
        after: updated,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );
    return updated;
  });
}

export async function reassignClient(id: string, input: ReassignClientInput, ctx: Ctx) {
  if (ctx.actor.role !== UserRole.MANAGER) {
    throw new ForbiddenError("Only managers may reassign clients");
  }
  const existing = await prisma.client.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError("Client not found");
  if (existing.ownerId === input.ownerId) {
    throw new BusinessRuleError("Client is already assigned to that associate");
  }
  const newOwner = await prisma.user.findFirst({
    where: { id: input.ownerId, active: true, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!newOwner) throw new BusinessRuleError("Target associate does not exist or is inactive");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { id },
      data: { ownerId: input.ownerId },
    });
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.ASSIGN,
        entityType: "client",
        entityId: id,
        before: { ownerId: existing.ownerId },
        after: { ownerId: input.ownerId },
        metadata: { reason: input.reason },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );
    await tx.activity.create({
      data: {
        type: ActivityType.SYSTEM,
        clientId: id,
        actorId: ctx.actor.id,
        summary: `Reassigned to ${newOwner.name}`,
        body: input.reason,
      },
    });
    await notifyUser(
      {
        userId: input.ownerId,
        type: NotificationType.CLIENT_ASSIGNED,
        title: "Client reassigned to you",
        body: `${updated.name} is now under your care.`,
        link: `/clients/${id}`,
      },
      tx,
    );
    return updated;
  });
}
