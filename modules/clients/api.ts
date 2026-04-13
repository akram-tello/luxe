import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { toPagination, type PaginationQuery } from "@/lib/validators/common";
import type { CreateClientInput, ReassignClientInput, UpdateClientInput } from "@/lib/validators/client";
import { listClients as repoList, findClientById, assertClientAccess } from "@/server/repositories/clients";
import { createClient as svcCreate, softDeleteClient, reassignClient, updateClient as svcUpdate } from "@/server/services/clients";
import { listActivitiesForClient } from "@/server/services/activities";
import { listSalesForClient } from "@/server/services/sales";
import { listStageHistory } from "@/server/services/pipeline";
import { NotFoundError } from "@/lib/errors";
import type { PipelineStage, ClientTier } from "@prisma/client";

type Ctx = { actor: SessionUser; ip?: string; userAgent?: string };

export async function list(
  actor: SessionUser,
  pagination: PaginationQuery,
  filters: { stage?: PipelineStage; tier?: ClientTier; ownerId?: string },
) {
  const { skip, take, page, pageSize } = toPagination(pagination);
  const { items, total } = await repoList(
    {
      q: pagination.q,
      stage: filters.stage,
      tier: filters.tier,
      ownerId: filters.ownerId,
      restrictToOwnerId: actor.role === UserRole.ASSOCIATE ? actor.id : undefined,
    },
    skip,
    take,
  );
  return { items, total, page, pageSize };
}

export async function detail(id: string, actor: SessionUser) {
  const client = await assertClientAccess(id, actor);
  if (!client) throw new NotFoundError("Client not found");
  const [activities, sales, stageHistory, openTasks] = await Promise.all([
    listActivitiesForClient(id, 100),
    listSalesForClient(id),
    listStageHistory(id),
    prisma.task.findMany({
      where: {
        clientId: id,
        deletedAt: null,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      include: { assignee: { select: { id: true, name: true } } },
    }),
  ]);
  return { client, activities, sales, stageHistory, openTasks };
}

export function create(input: CreateClientInput, ctx: Ctx) {
  return svcCreate(input, ctx);
}

export function update(id: string, input: UpdateClientInput, ctx: Ctx) {
  return svcUpdate(id, input, ctx);
}

export function archive(id: string, ctx: Ctx) {
  return softDeleteClient(id, ctx);
}

export function reassign(id: string, input: ReassignClientInput, ctx: Ctx) {
  return reassignClient(id, input, ctx);
}

export { findClientById };
