import { requireManagerForPage } from "@/lib/auth/guard";
import {
  associateLeaderboard,
  defaultRange,
  managerOverview,
} from "@/server/services/reports";
import { formatCurrency, initials } from "@/lib/utils/format";
import { getActiveStages, getStageMap } from "@/lib/constants";
import { Donut, BarList, BarsChart } from "../_components/charts";
import {
  PageHeader,
  SectionHead,
  Stat,
  Empty,
} from "../_components/primitives";

export default async function ReportsPage() {
  await requireManagerForPage();
  const [overview, thirty, ninety, activeStages, stageMap] = await Promise.all([
    managerOverview(),
    associateLeaderboard(defaultRange(30)),
    associateLeaderboard(defaultRange(90)),
    getActiveStages(),
    getStageMap(),
  ]);

  const avgDeal =
    overview.last30.saleCount > 0
      ? overview.last30.total / overview.last30.saleCount
      : 0;
  const pipelineMap = new Map(overview.pipeline.map((p) => [p.stage, p.count]));
  const won = activeStages
    .filter((s) => s.kind === "WON")
    .reduce((sum, s) => sum + (pipelineMap.get(s.key) ?? 0), 0);
  const conversion =
    overview.totalClients > 0
      ? ((won / overview.totalClients) * 100).toFixed(1)
      : "0.0";

  const donutData = overview.pipeline
    .filter((p) => p.count > 0)
    .map((p) => ({
      key: p.stage,
      label: stageMap.get(p.stage)?.label ?? p.stage,
      value: p.count,
    }));

  const funnelBars = activeStages
    .filter((s) => s.kind !== "LOST")
    .map((s) => ({
      key: s.key,
      label: s.label,
      value: pipelineMap.get(s.key) ?? 0,
    }));

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Performance"
        title="Reports"
        subtitle="The house, measured. Trailing windows, attributed revenue, and the shape of the funnel."
      />

      <section className="grid grid-cols-4 gap-5">
        <Stat
          label="Active clients"
          value={overview.totalClients.toLocaleString()}
        />
        <Stat
          label="Revenue · 30d"
          value={formatCurrency(overview.last30.total)}
          hint={`${overview.last30.saleCount} sales`}
        />
        <Stat
          label="Avg deal"
          value={formatCurrency(avgDeal)}
          hint="Trailing 30 days"
        />
        <Stat
          label="Conversion"
          value={`${conversion}%`}
          hint={`${won} won overall`}
        />
      </section>

      <section className="grid grid-cols-[1.1fr_1fr] gap-5">
        <div className="surface-flat p-8">
          <SectionHead
            eyebrow="Funnel"
            title="Stage-by-stage volume"
            hint="Active journey stages, excluding lost."
          />
          <div className="mt-4">
            <BarsChart
              data={funnelBars}
              height={220}
              color="rgb(var(--chart-primary))"
            />
          </div>
        </div>

        <div className="surface-flat p-8">
          <SectionHead
            eyebrow="Distribution"
            title="Pipeline mix"
            hint="Weight of every stage across the roster."
          />
          <div className="flex items-center justify-between gap-6 mt-4">
            <div className="shrink-0">
              <Donut
                data={donutData}
                size={200}
                thickness={18}
                centerLabel="Clients"
                centerValue={overview.totalClients.toLocaleString()}
              />
            </div>
            <ul className="flex-1 space-y-1.5 min-w-0">
              {donutData.length === 0 ? (
                <li className="text-[13px] text-ink-3">No data yet.</li>
              ) : (
                donutData.map((d, i) => {
                  const palette = [
                    "rgb(var(--chart-1))",
                    "rgb(var(--chart-2))",
                    "rgb(var(--chart-3))",
                    "rgb(var(--chart-4))",
                    "rgb(var(--chart-5))",
                    "rgb(var(--chart-6))",
                    "rgb(var(--chart-7))",
                  ];
                  return (
                    <li
                      key={d.key}
                      className="flex items-center justify-between gap-2 py-1"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: palette[i % palette.length] }}
                        />
                        <span className="text-[12px] text-ink-2 truncate">
                          {d.label}
                        </span>
                      </span>
                      <span className="numeric text-[12px] text-ink-3 shrink-0">
                        {d.value}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-5">
        <LeaderboardCard title="Last 30 days" subtitle="Attributed revenue" rows={thirty} />
        <LeaderboardCard title="Last 90 days" subtitle="Attributed revenue" rows={ninety} />
      </section>

      <section className="surface-flat p-8">
        <SectionHead
          eyebrow="Detail"
          title="Associate performance · 30d"
          hint="Bar lengths are relative to the top performer in the window."
        />
        {thirty.length === 0 ? (
          <Empty>No sales recorded in this period.</Empty>
        ) : (
          <div className="mt-2">
            <BarList
              rows={thirty.map((r) => ({
                key: r.associateId,
                label: r.name,
                sub: `${r.saleCount} sales · ${r.email}`,
                value: r.total,
              }))}
              format={(n) => formatCurrency(n)}
              color="rgb(var(--chart-primary))"
            />
          </div>
        )}
      </section>
    </div>
  );
}

function LeaderboardCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: {
    associateId: string;
    name: string;
    total: number;
    saleCount: number;
    email: string;
  }[];
}) {
  return (
    <div className="surface-flat">
      <div className="px-7 pt-6 pb-2">
        <p className="eyebrow">{subtitle}</p>
        <h2 className="mt-1 font-display text-[22px] leading-tight tracking-tight-2">
          {title}
        </h2>
      </div>
      {rows.length === 0 ? (
        <Empty>No sales in this range.</Empty>
      ) : (
        <ul className="px-2 pb-3">
          {rows.map((r, i) => (
            <li
              key={r.associateId}
              className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl row-hover"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="numeric text-[14px] text-ink-3 w-6 text-right">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="initial-badge h-9 w-9 text-[12px]">
                  {initials(r.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] text-ink truncate">{r.name}</p>
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink-4 mt-0.5 truncate">
                    {r.saleCount} sales
                  </p>
                </div>
              </div>
              <p className="font-display text-[20px] leading-none tracking-tight-2 font-light shrink-0">
                {formatCurrency(r.total)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
