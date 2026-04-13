import { UserRole, type TaskPriority, type TaskStatus, type TaskType } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { toPagination, type PaginationQuery } from "@/lib/validators/common";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validators/task";
import { findTaskById, listTasks } from "@/server/repositories/tasks";
import { createTask, softDeleteTask, updateTask } from "@/server/services/tasks";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

type Ctx = { actor: SessionUser; ip?: string; userAgent?: string };

export async function list(
  actor: SessionUser,
  pagination: PaginationQuery,
  filters: {
    status?: TaskStatus;
    type?: TaskType;
    priority?: TaskPriority;
    assigneeId?: string;
    clientId?: string;
    overdue?: boolean;
  },
) {
  const { skip, take, page, pageSize } = toPagination(pagination);
  const { items, total } = await listTasks(
    {
      ...filters,
      q: pagination.q,
      restrictToAssigneeId: actor.role === UserRole.ASSOCIATE ? actor.id : undefined,
    },
    skip,
    take,
  );
  return { items, total, page, pageSize };
}

export async function detail(id: string, actor: SessionUser) {
  const task = await findTaskById(id);
  if (!task) throw new NotFoundError("Task not found");
  if (actor.role === UserRole.ASSOCIATE) {
    if (task.assigneeId !== actor.id && task.client.ownerId !== actor.id) {
      throw new ForbiddenError();
    }
  }
  return task;
}

export function create(input: CreateTaskInput, ctx: Ctx) {
  return createTask(input, ctx);
}

export function update(id: string, input: UpdateTaskInput, ctx: Ctx) {
  return updateTask(id, input, ctx);
}

export function cancel(id: string, ctx: Ctx) {
  return softDeleteTask(id, ctx);
}
