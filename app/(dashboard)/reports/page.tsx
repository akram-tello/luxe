import { requireManagerForPage } from "@/lib/auth/guard";
import {
  associateLeaderboard,
  defaultRange,
  managerOverview,
} from "@/server/services/reports";
import { formatCurrency } from "@/lib/utils/format";
import { PIPELINE_LABEL } from "@/lib/constants";

export default async function ReportsPage() {
  await requireManagerForPage();
  const [overview, thirty, ninety] = await Promise.all([
    managerOverview(),
    associateLeaderboard(defaultRange(30)),
    associateLeaderboard(defaultRange(90)),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="label">Performance</p>
        <h1 className="font-serif text-3xl mt-1">Reports</h1>
      </div>

      <section className="grid grid-cols-4 gap-6">
        <Stat label="Active clients" value={overview.totalClients.toString()} />
        <Stat
          label="Revenue (30d)"
          value={formatCurrency(overview.last30.total)}
          hint={`${overview.last30.saleCount} sales`}
        />
        <Stat label="Overdue tasks" value={overview.totalOverdue.toString()} danger={overview.totalOverdue > 0} />
        <Stat label="Associates" value={overview.activeUsers.toString()} />
      </section>

      <section>
        <Header title="Pipeline" />
        <div className="panel p-8">
          <div className="grid grid-cols-7 gap-4">
            {overview.pipeline.map((r) => (
              <div key={r.stage} className="text-center">
                <p className="label">{PIPELINE_LABEL[r.stage]}</p>
                <p className="font-serif text-3xl mt-3">{r.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <Leaderboard title="Last 30 days" rows={thirty} />
        <Leaderboard title="Last 90 days" rows={ninety} />
      </section>
    </div>
  );
}

function Leaderboard({
  title,
  rows,
}: {
  title: string;
  rows: { associateId: string; name: string; total: number; saleCount: number }[];
}) {
  return (
    <div>
      <Header title={title} />
      <div className="panel divide-y divide-line">
        {rows.length === 0 ? (
          <p className="p-6 text-bone/40 text-sm">No sales in this range.</p>
        ) : (
          rows.map((r, i) => (
            <div key={r.associateId} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-serif text-xl text-gold w-6 text-right">{i + 1}</span>
                <p className="text-sm">{r.name}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-lg">{formatCurrency(r.total)}</p>
                <p className="text-[10px] uppercase tracking-widest text-bone/40">{r.saleCount} sales</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  danger,
}: {
  label: string;
  value: string;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <div className="panel p-8">
      <p className="stat-label">{label}</p>
      <p className={`stat-value mt-3 ${danger ? "text-danger" : ""}`}>{value}</p>
      {hint ? <p className="text-[11px] uppercase tracking-widest text-bone/40 mt-2">{hint}</p> : null}
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="hairline mt-3" />
    </div>
  );
}
