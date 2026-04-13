import Link from "next/link";
import { requireUserForPage } from "@/lib/auth/guard";
import * as tasksApi from "@/modules/tasks/api";
import { paginationQuery } from "@/lib/validators/common";
import { taskFilterSchema } from "@/lib/validators/task";
import { formatRelative } from "@/lib/utils/format";
import { TaskRow } from "./TaskRow";
import { PageHeader, Empty } from "../_components/primitives";

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
    <div className="space-y-10">
      <PageHeader
        eyebrow="Operations"
        title="Tasks"
        subtitle={`${total.toLocaleString()} tasks · discipline is the product.`}
      />

      <nav className="flex items-center gap-2">
        <FilterLink label="All" href="/tasks" active={!raw.overdue && !raw.status} />
        <FilterLink
          label="Overdue"
          href="/tasks?overdue=true"
          active={raw.overdue === "true"}
          tone="danger"
        />
        <FilterLink
          label="Pending"
          href="/tasks?status=PENDING"
          active={raw.status === "PENDING"}
        />
        <FilterLink
          label="Completed"
          href="/tasks?status=COMPLETED"
          active={raw.status === "COMPLETED"}
        />
      </nav>

      <div className="surface-flat overflow-hidden">
        {items.length === 0 ? (
          <Empty>No tasks match the current filter.</Empty>
        ) : (
          <ul>
            {items.map((t, i) => (
              <li key={t.id}>
                <TaskRow
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
                {i < items.length - 1 ? <div className="mx-6 divider" /> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
  tone,
}: {
  label: string;
  href: string;
  active: boolean;
  tone?: "danger";
}) {
  const cls = active
    ? tone === "danger"
      ? "bg-danger text-paper border-danger"
      : "bg-ink text-paper border-ink"
    : "bg-chalk text-ink-2 border-hair-2 hover:text-ink hover:border-hair-3";
  return (
    <Link
      href={href}
      className={`inline-flex items-center h-9 px-4 rounded-full text-[12px] font-medium border transition-colors ${cls}`}
    >
      {label}
    </Link>
  );
}

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
