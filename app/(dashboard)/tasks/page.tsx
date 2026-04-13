import Link from "next/link";
import { requireUserForPage } from "@/lib/auth/guard";
import * as tasksApi from "@/modules/tasks/api";
import { paginationQuery } from "@/lib/validators/common";
import { taskFilterSchema } from "@/lib/validators/task";
import { formatRelative } from "@/lib/utils/format";
import { TaskRow } from "./TaskRow";

type Search = { [key: string]: string | string[] | undefined };

export default async function TasksIndex({ searchParams }: { searchParams: Search }) {
  const actor = await requireUserForPage();
  const pagination = paginationQuery.parse({
    page: first(searchParams.page) ?? "1",
    pageSize: first(searchParams.pageSize) ?? "50",
    q: first(searchParams.q),
  });
  const raw = taskFilterSchema.parse({
    status: first(searchParams.status),
    type: first(searchParams.type),
    priority: first(searchParams.priority),
    assigneeId: first(searchParams.assigneeId),
    clientId: first(searchParams.clientId),
    overdue: first(searchParams.overdue),
  });
  const { items, total } = await tasksApi.list(actor, pagination, {
    ...raw,
    overdue: raw.overdue === "true" ? true : undefined,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">Operations</p>
          <h1 className="font-serif text-3xl mt-1">Tasks</h1>
          <p className="text-sm text-bone/50 mt-2">{total.toLocaleString()} tasks</p>
        </div>
        <div className="flex gap-3">
          <FilterLink label="All" href="/tasks" active={!raw.overdue && !raw.status} />
          <FilterLink label="Overdue" href="/tasks?overdue=true" active={raw.overdue === "true"} />
          <FilterLink label="Pending" href="/tasks?status=PENDING" active={raw.status === "PENDING"} />
          <FilterLink label="Completed" href="/tasks?status=COMPLETED" active={raw.status === "COMPLETED"} />
        </div>
      </div>

      <div className="panel divide-y divide-line">
        {items.length === 0 ? (
          <p className="p-10 text-center text-bone/40">No tasks match the current filter.</p>
        ) : (
          items.map((t) => (
            <TaskRow
              key={t.id}
              task={{
                id: t.id,
                title: t.title,
                type: t.type,
                priority: t.priority,
                status: t.status,
                dueDate: t.dueDate.toISOString(),
                clientId: t.clientId,
                clientName: t.client.name,
                assignee: t.assignee.name,
                overdue:
                  t.dueDate < new Date() &&
                  t.status !== "COMPLETED" &&
                  t.status !== "CANCELLED",
                relative: formatRelative(t.dueDate),
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`pill ${
        active ? "border-gold/60 text-gold bg-gold/5" : "border-line text-bone/50 hover:text-bone"
      }`}
    >
      {label}
    </Link>
  );
}

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
