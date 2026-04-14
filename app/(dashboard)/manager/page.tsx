import Link from "next/link";
import { requireManagerForPage } from "@/lib/auth/guard";
import {
  managerOverview,
  associateLeaderboard,
  defaultRange,
} from "@/server/services/reports";
import { formatCurrency } from "@/lib/utils/format";
import { getActiveStages, getStageMap } from "@/lib/constants";
import { Donut, BarList, JourneyRibbon } from "../_components/charts";
import {
  PageHeader,
  SectionHead,
  Stat,
  LinkCta,
  Empty,
} from "../_components/primitives";

export default async function ManagerHome() {
  await requireManagerForPage();
  const [overview, leaderboard, activeStages, stageMap] = await Promise.all([
    managerOverview(),
    associateLeaderboard(defaultRange(30)),
    getActiveStages(),
    getStageMap(),
  ]);

  const pipelineMap = new Map(overview.pipeline.map((p) => [p.stage, p.count]));
  const steps = activeStages
    .filter((s) => s.kind !== "LOST")
    .map((s) => ({
      stage: s.key,
      label: s.label,
      kind: s.kind,
      count: pipelineMap.get(s.key) ?? 0,
    }));

  const wonCount = activeStages
    .filter((s) => s.kind === "WON")
    .reduce((sum, s) => sum + (pipelineMap.get(s.key) ?? 0), 0);
  const lostCount = activeStages
    .filter((s) => s.kind === "LOST")
    .reduce((sum, s) => sum + (pipelineMap.get(s.key) ?? 0), 0);
  const activeFunnel = steps.reduce((s, x) => s + x.count, 0);
  const conversion =
    overview.totalClients > 0
      ? ((wonCount / overview.totalClients) * 100).toFixed(1)
      : "0.0";
  const avgDeal =
    overview.last30.saleCount > 0
      ? overview.last30.total / overview.last30.saleCount
      : 0;

  const donutData = overview.pipeline
    .filter((p) => p.count > 0)
    .map((p) => ({
      key: p.stage,
      label: stageMap.get(p.stage)?.label ?? p.stage,
      value: p.count,
    }));

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Boutique Overview"
        title="The house at a glance."
        subtitle="Live operational snapshot, attributed revenue, and the discipline of every associate."
        actions={
          <>
            <Link href="/reports" className="btn-ghost">
              Full reports
            </Link>
            <Link href="/pipeline" className="btn-primary">
              View pipeline
            </Link>
          </>
        }
      />

      {/* Row 1 — KPI whisper-stats */}
      <section className="grid grid-cols-4 gap-5">
        <Stat
          label="Active Clients"
          value={overview.totalClients.toLocaleString()}
          hint={`${activeFunnel} in active funnel`}
        />
        <Stat
          label="Revenue · 30d"
          value={formatCurrency(overview.last30.total)}
          hint={`${overview.last30.saleCount} sales · avg ${formatCurrency(avgDeal)}`}
        />
        <Stat
          label="Conversion"
          value={`${conversion}%`}
          hint={`${wonCount} won · ${lostCount} lost`}
        />
        <Stat
          label="Overdue Tasks"
          value={overview.totalOverdue.toString()}
          tone={overview.totalOverdue > 0 ? "danger" : "success"}
          hint={
            overview.totalOverdue > 0
              ? "Intervene before end of day"
              : "No discipline gaps"
          }
        />
      </section>

      {/* Row 2 — Customer journey ribbon */}
      <section>
        <SectionHead
          eyebrow="Customer Journey"
          title="From prospect to signature"
          hint="How the house moves people through the sale — last 24h."
        />
        <div className="surface-flat p-10">
          <JourneyRibbon steps={steps} totalHint={activeFunnel || 1} />
        </div>
      </section>

      {/* Row 3 — Donut + Leaderboard bars */}
      <section className="grid grid-cols-[1fr_1.35fr] gap-5">
        <div className="surface-flat p-8 flex flex-col">
          <SectionHead
            eyebrow="Distribution"
            title="Pipeline mix"
            hint="Weight of each stage across the entire roster."
          />
          <div className="flex-1 flex items-center justify-between gap-6 mt-2">
            <div className="shrink-0">
              <Donut
                data={donutData}
                size={200}
                thickness={18}
                centerLabel="Clients"
                centerValue={overview.totalClients.toLocaleString()}
              />
            </div>
            <ul className="flex-1 space-y-2 min-w-0">
              {donutData.length === 0 ? (
                <li className="text-ink-3 text-[13px]">No pipeline data yet.</li>
              ) : (
                donutData.map((d, i) => {
                  const palette = [
                    "#141311",
                    "#3C3A35",
                    "#8B6F47",
                    "#B89974",
                    "#A7B495",
                    "#C8D1B8",
                    "#A74B3E",
                  ];
                  const pct = ((d.value / overview.totalClients) * 100).toFixed(0);
                  return (
                    <li
                      key={d.key}
                      className="flex items-center justify-between gap-3 py-1"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ background: palette[i % palette.length] }}
                        />
                        <span className="text-[13px] text-ink truncate">
                          {d.label}
                        </span>
                      </span>
                      <span className="numeric text-[12px] text-ink-3 shrink-0">
                        {d.value} · {pct}%
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>

        <div className="surface-flat p-8">
          <SectionHead
            eyebrow="Last 30 days"
            title="Associate leaderboard"
            hint="Attributed revenue per associate."
            action={<LinkCta href="/reports">All periods</LinkCta>}
          />
          {leaderboard.length === 0 ? (
            <Empty>No sales recorded in the last 30 days.</Empty>
          ) : (
            <BarList
              rows={leaderboard.map((r) => ({
                key: r.associateId,
                label: r.name,
                sub: `${r.saleCount} sales`,
                value: r.total,
              }))}
              format={(n) => formatCurrency(n)}
              color="#141311"
            />
          )}
        </div>
      </section>

      {/* Row 4 — Focus row */}
      <section className="grid grid-cols-3 gap-5">
        <FocusCard
          eyebrow="Discipline"
          title="Zero missed follow-ups"
          body="Tasks auto-generate on stage change, SLA breach, and dormancy. Cron runs hourly."
          href="/tasks"
          cta="Review the queue"
        />
        <FocusCard
          eyebrow="Clienteling"
          title="Curate every touchpoint"
          body="Templates carry your voice. Activities log every contact with precision."
          href="/templates"
          cta="Manage templates"
        />
        <FocusCard
          eyebrow="People"
          title={`${overview.activeUsers} associates on the floor`}
          body="Ownership is enforced at the database. No client drifts between hands."
          href="/clients"
          cta="See the roster"
        />
      </section>
    </div>
  );
}

function FocusCard({
  eyebrow,
  title,
  body,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="surface-flat p-7 group hover:shadow-card focus-card block"
    >
      <p className="eyebrow">{eyebrow}</p>
      <p className="mt-3 font-display text-[22px] leading-tight tracking-tight-2 text-balance">
        {title}
      </p>
      <p className="mt-2 text-[13px] text-ink-3 leading-relaxed">{body}</p>
      <p className="mt-6 text-[12px] text-ink inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
        {cta} <span aria-hidden>→</span>
      </p>
    </Link>
  );
}
