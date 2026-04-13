import { Prisma, TaskPriority, TaskStatus, type TaskType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type Tx = Prisma.TransactionClient | typeof prisma;

export type TaskFilters = {
  assigneeId?: string;
  clientId?: string;
  status?: TaskStatus;
  type?: TaskType;
  priority?: TaskPriority;
  overdue?: boolean;
  restrictToAssigneeId?: string;
  q?: string;
};

export function taskWhere(filters: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { deletedAt: null };
  if (filters.restrictToAssigneeId) where.assigneeId = filters.restrictToAssigneeId;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.priority) where.priority = filters.priority;
  if (filters.overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
  }
  if (filters.q && filters.q.length > 0) {
    where.OR = [
      { title: { contains: filters.q } },
      { description: { contains: filters.q } },
    ];
  }
  return where;
}

export async function listTasks(filters: TaskFilters, skip: number, take: number, tx: Tx = prisma) {
  const where = taskWhere(filters);
  const [items, total] = await Promise.all([
    tx.task.findMany({
      where,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      skip,
      take,
      include: {
        client: { select: { id: true, name: true, tier: true, stage: true, ownerId: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    tx.task.count({ where }),
  ]);
  return { items, total };
}

export async function findTaskById(id: string, tx: Tx = prisma) {
  return tx.task.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: { select: { id: true, name: true, tier: true, phone: true, ownerId: true } },
      assignee: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function countOverdueForUser(userId: string, tx: Tx = prisma): Promise<number> {
  return tx.task.count({
    where: {
      deletedAt: null,
      assigneeId: userId,
      dueDate: { lt: new Date() },
      status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
    },
  });
}
