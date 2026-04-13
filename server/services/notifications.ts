import { NotificationType, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type Tx = Prisma.TransactionClient | typeof prisma;

export async function notifyUser(
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    metadata?: Record<string, unknown>;
  },
  tx: Tx = prisma,
): Promise<void> {
  await tx.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
      metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function notifyManagers(
  params: { type: NotificationType; title: string; body: string; link?: string; metadata?: Record<string, unknown> },
  tx: Tx = prisma,
): Promise<number> {
  const managers = await tx.user.findMany({
    where: { role: UserRole.MANAGER, active: true, deletedAt: null },
    select: { id: true },
  });
  for (const m of managers) {
    await notifyUser({ userId: m.id, ...params }, tx);
  }
  return managers.length;
}
