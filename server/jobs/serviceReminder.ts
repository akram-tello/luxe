import { TaskPriority, TaskType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { SERVICE_YEARS } from "@/lib/constants";
import { createSystemTask } from "@/server/services/tasks";
import type { JobResult } from "./index";

const JOB = "service_reminder";

export async function runServiceReminderJob(): Promise<JobResult> {
  const startedAt = new Date();
  const now = new Date();
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - SERVICE_YEARS);

  const upperBound = new Date(fiveYearsAgo);
  upperBound.setDate(upperBound.getDate() + 1);

  const sales = await prisma.sale.findMany({
    where: {
      deletedAt: null,
      purchaseDate: { lt: upperBound, gte: new Date(fiveYearsAgo.getFullYear() - 1, fiveYearsAgo.getMonth(), fiveYearsAgo.getDate()) },
    },
    select: {
      id: true,
      product: true,
      associateId: true,
      purchaseDate: true,
      client: { select: { id: true, name: true, ownerId: true } },
    },
    take: 500,
  });

  let created = 0;
  for (const s of sales) {
    const dueAnchor = new Date(s.purchaseDate);
    dueAnchor.setFullYear(dueAnchor.getFullYear() + SERVICE_YEARS);
    if (dueAnchor.getTime() > now.getTime() + 24 * 60 * 60 * 1000) continue;

    const source = `${JOB}_${s.id}`;
    const existing = await prisma.task.findFirst({
      where: {
        clientId: s.client.id,
        sourceJob: source,
        deletedAt: null,
      },
    });
    if (existing) continue;

    const due = new Date();
    due.setDate(due.getDate() + 3);
    await createSystemTask({
      title: `Service reminder — ${s.client.name} (${s.product})`,
      description: `Five-year service check for ${s.product} purchased on ${s.purchaseDate.toISOString().slice(0, 10)}.`,
      type: TaskType.SERVICE,
      priority: TaskPriority.NORMAL,
      dueDate: due,
      clientId: s.client.id,
      assigneeId: s.associateId ?? s.client.ownerId,
      sourceJob: source,
    });
    created += 1;
  }

  return {
    job: JOB,
    scanned: sales.length,
    created,
    notified: 0,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
  };
}
