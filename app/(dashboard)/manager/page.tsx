import Link from "next/link";
import { requireManagerForPage } from "@/lib/auth/guard";
import { managerOverview, associateLeaderboard, defaultRange } from "@/server/services/reports";
import { formatCurrency } from "@/lib/utils/format";
import { PIPELINE_LABEL } from "@/lib/constants";

export default async function ManagerHome() {
  await requireManagerForPage();
  const [overview, leaderboard] = await Promise.all([
    managerOverview(),
    associateLeaderboard(defaultRange(30)),
  ]);

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-4 gap-6">
        <Stat label="Active Clients" value={overview.totalClients.toString()} />
        <Stat
          label="30-day Revenue"
          value={formatCurrency(overview.last30.total)}
          hint={`${overview.last30.saleCount} sales`}
        />
        <Stat label="Overdue Tasks" value={overview.totalOverdue.toString()} danger={overview.totalOverdue > 0} />
        <Stat label="Associates" value={overview.activeUsers.toString()} />
      </section>

      <section>
        <SectionHeader title="Pipeline Distribution" subtitle="Live snapshot" />
        <div className="panel p-8">
          <div className="grid grid-cols-7 gap-4">
            {overview.pipeline.map((row) => (
              <div key={row.stage} className="text-center">
                <p className="label">{PIPELINE_LABEL[row.stage]}</p>
                <p className="font-serif text-3xl mt-3">{row.count}</p>
                <div className="mt-4 h-1 bg-line">
                  <div
                    className="h-full bg-gold"
                    style={{
                      width: `${overview.totalClients > 0 ? (row.count / overview.totalClients) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Associate Leaderboard" subtitle="Last 30 days — attributed revenue" />
        <div className="panel divide-y divide-line">
          {leaderboard.length === 0 ? (
            <p className="p-8 text-bone/40 text-sm">No sales recorded in the last 30 days.</p>
          ) : (
            leaderboard.map((row, idx) => (
              <div key={row.associateId} className="px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="font-serif text-2xl text-gold w-6 text-right">{idx + 1}</span>
                  <div>
                    <p className="text-sm">{row.name}</p>
                    <p className="text-[11px] uppercase tracking-widest text-bone/40">{row.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-serif text-xl">{formatCurrency(row.total)}</p>
                  <p className="text-[11px] uppercase tracking-widest text-bone/40">{row.saleCount} sales</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="flex gap-4">
        <Link href="/clients/new" className="btn-primary">
          New Client
        </Link>
        <Link href="/templates" className="btn-ghost">
          Manage Templates
        </Link>
        <Link href="/reports" className="btn-ghost">
          Full Reports
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
      <p className="label">{subtitle}</p>
      <h2 className="font-serif text-2xl mt-1">{title}</h2>
      <div className="hairline mt-4" />
    </div>
  );
}
