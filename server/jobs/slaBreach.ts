import { NotificationType, TaskPriority, TaskType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { SLA_HOURS } from "@/lib/constants";
import { createSystemTask } from "@/server/services/tasks";
import { notifyManagers } from "@/server/services/notifications";
import type { JobResult } from "./index";

const JOB = "sla_breach";

export async function runSlaBreachJob(): Promise<JobResult> {
  const startedAt = new Date();
  const threshold = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000);

  const candidates = await prisma.client.findMany({
    where: {
      deletedAt: null,
      createdAt: { lt: threshold },
    },
    select: { id: true, name: true, ownerId: true, createdAt: true },
    take: 1000,
  });

  let created = 0;
  let notified = 0;

  for (const c of candidates) {
    const activityCount = await prisma.activity.count({
      where: {
        clientId: c.id,
        deletedAt: null,
        occurredAt: { gt: c.createdAt },
        type: { not: "SYSTEM" },
      },
    });
    if (activityCount > 0) continue;

    const before = await prisma.task.findFirst({
      where: {
        clientId: c.id,
        sourceJob: JOB,
        deletedAt: null,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      select: { id: true },
    });
    if (before) continue;

    await createSystemTask({
      title: `SLA breach — first contact with ${c.name}`,
      description: `No activity within ${SLA_HOURS}h of creation.`,
      type: TaskType.FOLLOW_UP,
      priority: TaskPriority.HIGH,
      dueDate: new Date(),
      clientId: c.id,
      assigneeId: c.ownerId,
      sourceJob: JOB,
    });
    created += 1;
    const count = await notifyManagers({
      type: NotificationType.SLA_BREACH,
      title: `SLA breach — ${c.name}`,
      body: `No contact in ${SLA_HOURS}h since client creation.`,
      link: `/clients/${c.id}`,
      metadata: { clientId: c.id, job: JOB },
    });
    notified += count;
  }

  return {
    job: JOB,
    scanned: candidates.length,
    created,
    notified,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
  };
}
