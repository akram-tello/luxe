import { PipelineStage, Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type DateRange = { from: Date; to: Date };

export function defaultRange(days = 30): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
}

export async function pipelineDistribution(ownerId?: string) {
  const base: Prisma.ClientWhereInput = { deletedAt: null };
  if (ownerId) base.ownerId = ownerId;
  const rows = await prisma.client.groupBy({
    by: ["stage"],
    where: base,
    _count: { _all: true },
  });
  const map = new Map<PipelineStage, number>();
  for (const r of rows) map.set(r.stage, r._count._all);
  const stages: PipelineStage[] = ["PROSPECT", "CONTACTED", "ENGAGED", "APPOINTMENT", "NEGOTIATION", "WON", "LOST"];
  return stages.map((stage) => ({ stage, count: map.get(stage) ?? 0 }));
}

export async function associateLeaderboard(range: DateRange = defaultRange(90)) {
  const rows = await prisma.sale.groupBy({
    by: ["associateId"],
    where: {
      deletedAt: null,
      purchaseDate: { gte: range.from, lte: range.to },
    },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const associates = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.associateId) } },
    select: { id: true, name: true, email: true },
  });
  const byId = new Map(associates.map((a) => [a.id, a]));
  return rows
    .map((r) => ({
      associateId: r.associateId,
      name: byId.get(r.associateId)?.name ?? "Unknown",
      email: byId.get(r.associateId)?.email ?? "",
      total: Number(r._sum.amount ?? 0),
      saleCount: r._count._all,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function associateSummary(userId: string) {
  const [openClients, overdue, dueToday, pipelineClients, last30SalesAgg] = await Promise.all([
    prisma.client.count({ where: { ownerId: userId, deletedAt: null } }),
    prisma.task.count({
      where: {
        deletedAt: null,
        assigneeId: userId,
        dueDate: { lt: new Date() },
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      },
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        assigneeId: userId,
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        dueDate: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      },
    }),
    prisma.client.count({
      where: {
        ownerId: userId,
        deletedAt: null,
        stage: { in: ["CONTACTED", "ENGAGED", "APPOINTMENT", "NEGOTIATION"] },
      },
    }),
    prisma.sale.aggregate({
      where: {
        deletedAt: null,
        associateId: userId,
        purchaseDate: { gte: daysAgo(30) },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  return {
    openClients,
    overdueTasks: overdue,
    dueToday,
    pipelineClients,
    last30: {
      total: Number(last30SalesAgg._sum.amount ?? 0),
      saleCount: last30SalesAgg._count._all,
    },
  };
}

export async function managerOverview() {
  const [totalClients, totalOverdue, last30SalesAgg, activeUsers, pipeline] = await Promise.all([
    prisma.client.count({ where: { deletedAt: null } }),
    prisma.task.count({
      where: {
        deletedAt: null,
        dueDate: { lt: new Date() },
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      },
    }),
    prisma.sale.aggregate({
      where: { deletedAt: null, purchaseDate: { gte: daysAgo(30) } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.user.count({ where: { active: true, deletedAt: null } }),
    pipelineDistribution(),
  ]);

  return {
    totalClients,
    totalOverdue,
    activeUsers,
    last30: {
      total: Number(last30SalesAgg._sum.amount ?? 0),
      saleCount: last30SalesAgg._count._all,
    },
    pipeline,
  };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
