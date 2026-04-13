import { Prisma, type PipelineStage, type ClientTier } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type Tx = Prisma.TransactionClient | typeof prisma;

export type ClientFilters = {
  ownerId?: string;
  stage?: PipelineStage;
  tier?: ClientTier;
  q?: string;
  restrictToOwnerId?: string;
};

export function clientWhere(filters: ClientFilters): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = { deletedAt: null };
  if (filters.restrictToOwnerId) where.ownerId = filters.restrictToOwnerId;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.stage) where.stage = filters.stage;
  if (filters.tier) where.tier = filters.tier;
  if (filters.q && filters.q.length > 0) {
    where.OR = [
      { name: { contains: filters.q } },
      { phone: { contains: filters.q } },
      { email: { contains: filters.q } },
    ];
  }
  return where;
}

export async function listClients(
  filters: ClientFilters,
  skip: number,
  take: number,
  tx: Tx = prisma,
) {
  const where = clientWhere(filters);
  const [items, total] = await Promise.all([
    tx.client.findMany({
      where,
      orderBy: [{ tier: "desc" }, { updatedAt: "desc" }],
      skip,
      take,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
    tx.client.count({ where }),
  ]);
  return { items, total };
}

export async function findClientById(id: string, tx: Tx = prisma) {
  return tx.client.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function assertClientAccess(
  id: string,
  user: { id: string; role: "MANAGER" | "ASSOCIATE" },
  tx: Tx = prisma,
) {
  const client = await tx.client.findFirst({
    where: { id, deletedAt: null },
    include: { owner: { select: { id: true, name: true, role: true } } },
  });
  if (!client) return null;
  if (user.role === "MANAGER") return client;
  if (client.ownerId !== user.id) return null;
  return client;
}
