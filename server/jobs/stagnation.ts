import { PipelineStage, TaskPriority, TaskType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { STAGNATION_DAYS } from "@/lib/constants";
import { createSystemTask } from "@/server/services/tasks";
import type { JobResult } from "./index";

const JOB = "stagnation";

const ACTIVE_STAGES: PipelineStage[] = [
  "PROSPECT",
  "CONTACTED",
  "ENGAGED",
  "APPOINTMENT",
  "NEGOTIATION",
];

export async function runStagnationJob(): Promise<JobResult> {
  const startedAt = new Date();
  const now = Date.now();
  let scanned = 0;
  let created = 0;

  for (const stage of ACTIVE_STAGES) {
    const days = STAGNATION_DAYS[stage];
    const threshold = new Date(now - days * 24 * 60 * 60 * 1000);

    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null,
        stage,
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
        title: `Stagnation alert — ${c.name} (${stage})`,
        description: `No contact for ${days}+ days while in ${stage} stage.`,
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
