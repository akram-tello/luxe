import { AuditAction, NotificationType, Prisma, TaskPriority, TaskStatus, TaskType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BusinessRuleError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validators/task";
import { diffObjects } from "@/lib/utils/diff";
import { writeAudit } from "@/server/services/audit";
import { notifyUser } from "@/server/services/notifications";

type Ctx = { actor: SessionUser; ip?: string; userAgent?: string };

export async function createTask(input: CreateTaskInput, ctx: Ctx) {
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, deletedAt: null },
    select: { id: true, ownerId: true, name: true },
  });
  if (!client) throw new NotFoundError("Client not found");

  if (ctx.actor.role === UserRole.ASSOCIATE && client.ownerId !== ctx.actor.id) {
    throw new ForbiddenError("You do not have access to this client");
  }

  const assigneeId = input.assigneeId ?? client.ownerId;
  if (ctx.actor.role === UserRole.ASSOCIATE && assigneeId !== ctx.actor.id) {
    throw new ForbiddenError("Associates may only assign tasks to themselves");
  }

  const assignee = await prisma.user.findFirst({
    where: { id: assigneeId, active: true, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!assignee) throw new BusinessRuleError("Assignee does not exist or is inactive");

  const dueDate = new Date(input.dueDate);
  if (Number.isNaN(dueDate.getTime())) throw new BusinessRuleError("Invalid due date");

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        dueDate,
        clientId: input.clientId,
        assigneeId,
        createdById: ctx.actor.id,
      },
    });

    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.CREATE,
        entityType: "task",
        entityId: task.id,
        after: task,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );

    if (assignee.id !== ctx.actor.id) {
      await notifyUser(
        {
          userId: assignee.id,
          type: NotificationType.TASK_ASSIGNED,
          title: "New task assigned",
          body: `${input.title} — due ${dueDate.toISOString()}`,
          link: `/tasks/${task.id}`,
        },
        tx,
      );
    }

    return task;
  });
}

export async function updateTask(id: string, input: UpdateTaskInput, ctx: Ctx) {
  const existing = await prisma.task.findFirst({
    where: { id, deletedAt: null },
    include: { client: { select: { id: true, ownerId: true } } },
  });
  if (!existing) throw new NotFoundError("Task not found");
  if (ctx.actor.role === UserRole.ASSOCIATE) {
    if (existing.assigneeId !== ctx.actor.id && existing.client.ownerId !== ctx.actor.id) {
      throw new ForbiddenError("You do not have access to this task");
    }
    if (input.assigneeId && input.assigneeId !== ctx.actor.id) {
      throw new ForbiddenError("Associates may not reassign tasks to others");
    }
  }

  const data: Prisma.TaskUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description ?? null;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.dueDate !== undefined) data.dueDate = new Date(input.dueDate);
  if (input.assigneeId !== undefined) data.assignee = { connect: { id: input.assigneeId } };
  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === TaskStatus.COMPLETED) {
      data.completedAt = new Date();
    } else if (existing.status === TaskStatus.COMPLETED) {
      data.completedAt = null;
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({ where: { id }, data });
    const diff = diffObjects(existing as Record<string, unknown>, updated as Record<string, unknown>);
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.UPDATE,
        entityType: "task",
        entityId: id,
        before: diff?.before,
        after: diff?.after,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );
    return updated;
  });
}

export async function completeTask(id: string, ctx: Ctx) {
  return updateTask(id, { status: TaskStatus.COMPLETED }, ctx);
}

export async function softDeleteTask(id: string, ctx: Ctx) {
  const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError("Task not found");
  if (ctx.actor.role !== UserRole.MANAGER && existing.createdById !== ctx.actor.id) {
    throw new ForbiddenError("Only managers or the task creator may cancel a task");
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id },
      data: { deletedAt: new Date(), status: TaskStatus.CANCELLED },
    });
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.DELETE,
        entityType: "task",
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

type SystemTaskInput = {
  title: string;
  description?: string;
  type: TaskType;
  priority?: TaskPriority;
  dueDate: Date;
  clientId: string;
  assigneeId: string;
  sourceJob: string;
};

export async function createSystemTask(
  input: SystemTaskInput,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const existing = await tx.task.findFirst({
    where: {
      clientId: input.clientId,
      sourceJob: input.sourceJob,
      status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      deletedAt: null,
    },
  });
  if (existing) return existing;
  return tx.task.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      priority: input.priority ?? TaskPriority.NORMAL,
      dueDate: input.dueDate,
      clientId: input.clientId,
      assigneeId: input.assigneeId,
      createdById: input.assigneeId,
      autoGenerated: true,
      sourceJob: input.sourceJob,
    },
  });
}
