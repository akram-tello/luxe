import { TaskPriority, TaskType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DORMANT_DAYS, getTerminalStages } from "@/lib/constants";
import { createSystemTask } from "@/server/services/tasks";
import type { JobResult } from "./index";

const JOB = "dormant_client";

export async function runDormantClientJob(): Promise<JobResult> {
  const startedAt = new Date();
  const threshold = new Date(Date.now() - DORMANT_DAYS * 24 * 60 * 60 * 1000);

  const terminals = await getTerminalStages();
  const terminalKeys = terminals.map((s) => s.key);

  const clients = await prisma.client.findMany({
    where: {
      deletedAt: null,
      stage: terminalKeys.length ? { notIn: terminalKeys } : undefined,
      OR: [
        { lastContactAt: { lt: threshold } },
        { lastContactAt: null, createdAt: { lt: threshold } },
      ],
    },
    select: { id: true, name: true, ownerId: true },
    take: 1000,
  });

  let created = 0;
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
      title: `Re-engage ${c.name}`,
      description: `No activity in over ${DORMANT_DAYS} days.`,
      type: TaskType.FOLLOW_UP,
      priority: TaskPriority.NORMAL,
      dueDate: due,
      clientId: c.id,
      assigneeId: c.ownerId,
      sourceJob: JOB,
    });
    created += 1;
  }

  return {
    job: JOB,
    scanned: clients.length,
    created,
    notified: 0,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
  };
}
