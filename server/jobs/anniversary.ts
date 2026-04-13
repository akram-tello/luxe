import { TaskPriority, TaskType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createSystemTask } from "@/server/services/tasks";
import type { JobResult } from "./index";

const JOB = "anniversary";

export async function runAnniversaryJob(): Promise<JobResult> {
  const startedAt = new Date();
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const clients = await prisma.$queryRaw<Array<{ id: string; name: string; ownerId: string; kind: string }>>`
    SELECT id, name, ownerId, 'anniversary' AS kind
      FROM clients
     WHERE deletedAt IS NULL
       AND anniversary IS NOT NULL
       AND MONTH(anniversary) = ${month}
       AND DAY(anniversary) = ${day}
    UNION
    SELECT id, name, ownerId, 'birthday' AS kind
      FROM clients
     WHERE deletedAt IS NULL
       AND birthday IS NOT NULL
       AND MONTH(birthday) = ${month}
       AND DAY(birthday) = ${day}
  `;

  let created = 0;
  for (const c of clients) {
    const source = `${JOB}_${c.kind}`;
    const existing = await prisma.task.findFirst({
      where: {
        clientId: c.id,
        sourceJob: source,
        deletedAt: null,
        createdAt: { gte: new Date(Date.UTC(today.getFullYear(), 0, 1)) },
      },
    });
    if (existing) continue;

    const due = new Date();
    due.setHours(23, 59, 59, 999);
    await createSystemTask({
      title:
        c.kind === "anniversary"
          ? `Anniversary greeting — ${c.name}`
          : `Birthday greeting — ${c.name}`,
      description:
        c.kind === "anniversary"
          ? `Today is ${c.name}'s anniversary. Consider a personalised outreach.`
          : `Today is ${c.name}'s birthday. Consider a personalised outreach.`,
      type: TaskType.MESSAGE,
      priority: TaskPriority.NORMAL,
      dueDate: due,
      clientId: c.id,
      assigneeId: c.ownerId,
      sourceJob: source,
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
