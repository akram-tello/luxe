import Link from "next/link";
import { requireUserForPage } from "@/lib/auth/guard";
import { associateSummary, pipelineDistribution } from "@/server/services/reports";
import { listTasks } from "@/server/repositories/tasks";
import { listClients } from "@/server/repositories/clients";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import { PIPELINE_LABEL } from "@/lib/constants";

export default async function AssociateHome() {
  const user = await requireUserForPage();
  const [summary, pipeline, todayTasks, overdueTasks, topClients] = await Promise.all([
    associateSummary(user.id),
    pipelineDistribution(user.id),
    listTasks(
      { assigneeId: user.id, status: undefined, restrictToAssigneeId: user.role === "ASSOCIATE" ? user.id : undefined },
      0,
      5,
    ),
    listTasks(
      { assigneeId: user.id, overdue: true, restrictToAssigneeId: user.role === "ASSOCIATE" ? user.id : undefined },
      0,
      5,
    ),
    listClients(
      { ownerId: user.id, restrictToOwnerId: user.role === "ASSOCIATE" ? user.id : undefined },
      0,
      6,
    ),
  ]);

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-4 gap-6">
        <Stat label="My Clients" value={summary.openClients.toString()} />
        <Stat
          label="30-day Revenue"
          value={formatCurrency(summary.last30.total)}
          hint={`${summary.last30.saleCount} sales`}
        />
        <Stat label="Due Today" value={summary.dueToday.toString()} />
        <Stat label="Overdue" value={summary.overdueTasks.toString()} danger={summary.overdueTasks > 0} />
      </section>

      <section className="grid grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Overdue" subtitle="Act first" />
          <div className="panel divide-y divide-line">
            {overdueTasks.items.length === 0 ? (
              <p className="p-6 text-bone/40 text-sm">No overdue tasks. Perfect discipline.</p>
            ) : (
              overdueTasks.items.map((t) => (
                <Link
                  key={t.id}
                  href={`/clients/${t.clientId}`}
                  className="block px-6 py-4 hover:bg-ink/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{t.title}</p>
                      <p className="text-[11px] uppercase tracking-widest text-bone/40 mt-1">
                        {t.client.name} · {t.type.replace("_", " ")}
                      </p>
                    </div>
                    <span className="pill-danger">{formatRelative(t.dueDate)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <SectionHeader title="Due Today" subtitle="In the queue" />
          <div className="panel divide-y divide-line">
            {todayTasks.items.length === 0 ? (
              <p className="p-6 text-bone/40 text-sm">Nothing scheduled right now.</p>
            ) : (
              todayTasks.items.map((t) => (
                <Link
                  key={t.id}
                  href={`/clients/${t.clientId}`}
                  className="block px-6 py-4 hover:bg-ink/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{t.title}</p>
                      <p className="text-[11px] uppercase tracking-widest text-bone/40 mt-1">
                        {t.client.name} · {t.type.replace("_", " ")}
                      </p>
                    </div>
                    <span className="pill-muted">{formatRelative(t.dueDate)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="My Pipeline" />
        <div className="panel p-8">
          <div className="grid grid-cols-7 gap-4">
            {pipeline.map((row) => (
              <div key={row.stage} className="text-center">
                <p className="label">{PIPELINE_LABEL[row.stage]}</p>
                <p className="font-serif text-3xl mt-3">{row.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Recent Clients" />
        <div className="grid grid-cols-3 gap-4">
          {topClients.items.length === 0 ? (
            <p className="text-bone/40 text-sm">No clients assigned to you yet.</p>
          ) : (
            topClients.items.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`} className="panel p-6 hover:border-gold/40 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-serif text-xl">{c.name}</p>
                  {c.tier === "VIP" ? <span className="pill-gold">VIP</span> : null}
                  {c.tier === "PRIORITY" ? <span className="pill-gold">Priority</span> : null}
                </div>
                <p className="text-[11px] uppercase tracking-widest text-bone/40 mt-2">
                  {PIPELINE_LABEL[c.stage]} · updated {formatRelative(c.updatedAt)}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="flex gap-4">
        <Link href="/clients/new" className="btn-primary">
          New Client
        </Link>
        <Link href="/tasks" className="btn-ghost">
          All Tasks
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value, hint, danger }: { label: string; value: string; hint?: string; danger?: boolean }) {
  return (
    <div className="panel p-8">
      <p className="stat-label">{label}</p>
      <p className={`stat-value mt-3 ${danger ? "text-danger" : ""}`}>{value}</p>
      {hint ? <p className="text-[11px] uppercase tracking-widest text-bone/40 mt-2">{hint}</p> : null}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {subtitle ? <p className="label">{subtitle}</p> : null}
      <h2 className="font-serif text-2xl mt-1">{title}</h2>
      <div className="hairline mt-4" />
    </div>
  );
}
