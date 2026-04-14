import { TaskPriority, TaskType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getFunnelStages } from "@/lib/constants";
import { createSystemTask } from "@/server/services/tasks";
import type { JobResult } from "./index";

const JOB = "stagnation";

export async function runStagnationJob(): Promise<JobResult> {
  const startedAt = new Date();
  const now = Date.now();
  let scanned = 0;
  let created = 0;

  const funnel = await getFunnelStages();

  for (const stage of funnel) {
    const days = stage.stagnationDays;
    if (!days || days >= 9999) continue;
    const threshold = new Date(now - days * 24 * 60 * 60 * 1000);

    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null,
        stage: stage.key,
        OR: [
          { lastContactAt: { lt: threshold } },
          { lastContactAt: null, updatedAt: { lt: threshold } },
        ],
      },
      select: { id: true, name: true, ownerId: true, lastContactAt: true, updatedAt: true },
      take: 500,
    });
    scanned += clients.length;

    for (const c of clients) {
      const existing = await prisma.task.findFirst({
        where: {
          clientId: c.id,
          sourceJob: JOB,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
      });
      if (existing) continue;

      const due = new Date();
      due.setDate(due.getDate() + 1);
      await createSystemTask({
        title: `Stagnation alert — ${c.name} (${stage.label})`,
        description: `No contact for ${days}+ days while in ${stage.label} stage.`,
        type: TaskType.FOLLOW_UP,
        priority: TaskPriority.HIGH,
        dueDate: due,
        clientId: c.id,
        assigneeId: c.ownerId,
        sourceJob: JOB,
      });
      created += 1;
    }
  }

  return {
    job: JOB,
    scanned,
    created,
    notified: 0,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
  };
}
