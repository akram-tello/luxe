import Link from "next/link";
import { requireUserForPage } from "@/lib/auth/guard";
import { associateSummary, pipelineDistribution } from "@/server/services/reports";
import { listTasks } from "@/server/repositories/tasks";
import { listClients } from "@/server/repositories/clients";
import { formatCurrency, formatRelative, initials } from "@/lib/utils/format";
import { getFunnelStages, getStageMap } from "@/lib/constants";
import { JourneyRibbon } from "../_components/charts";
import {
  PageHeader,
  SectionHead,
  Stat,
  Empty,
  LinkCta,
} from "../_components/primitives";
import { WelcomeBanner } from "../_components/WelcomeBanner";

export default async function AssociateHome() {
  const user = await requireUserForPage();
  const [summary, pipeline, todayTasks, overdueTasks, topClients, funnel, stageMap] = await Promise.all([
    associateSummary(user.id),
    pipelineDistribution(user.id),
    listTasks(
      {
        assigneeId: user.id,
        status: undefined,
        restrictToAssigneeId: user.role === "ASSOCIATE" ? user.id : undefined,
      },
      0,
      5,
    ),
    listTasks(
      {
        assigneeId: user.id,
        overdue: true,
        restrictToAssigneeId: user.role === "ASSOCIATE" ? user.id : undefined,
      },
      0,
      5,
    ),
    listClients(
      {
        ownerId: user.id,
        restrictToOwnerId: user.role === "ASSOCIATE" ? user.id : undefined,
      },
      0,
      6,
    ),
    getFunnelStages(),
    getStageMap(),
  ]);

  const pipelineMap = new Map(pipeline.map((p) => [p.stage, p.count]));
  const steps = funnel.map((s) => ({
    stage: s.key,
    label: s.label,
    kind: s.kind,
    count: pipelineMap.get(s.key) ?? 0,
  }));
  const totalFunnel = steps.reduce((s, x) => s + x.count, 0);

  return (
    <div className="space-y-12">
      <WelcomeBanner name={user.name} role="ASSOCIATE" />
      <PageHeader
        eyebrow="My Day"
        title={`Good ${greeting()}, ${user.name.split(" ")[0]}.`}
        subtitle="Start with the overdue, end with the promises kept."
        actions={
          <>
            <Link href="/tasks" className="btn-ghost">
              All tasks
            </Link>
            <Link href="/clients/new" className="btn-primary">
              New client
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-4 gap-5">
        <Stat
          label="My Clients"
          value={summary.openClients.toLocaleString()}
          hint={`${summary.pipelineClients} in active stages`}
        />
        <Stat
          label="Revenue · 30d"
          value={formatCurrency(summary.last30.total)}
          hint={`${summary.last30.saleCount} sales attributed`}
        />
        <Stat
          label="Due Today"
          value={summary.dueToday.toString()}
          hint="In the queue for today"
        />
        <Stat
          label="Overdue"
          value={summary.overdueTasks.toString()}
          tone={summary.overdueTasks > 0 ? "danger" : "success"}
          hint={
            summary.overdueTasks > 0 ? "Act first — clear these" : "Clean slate"
          }
        />
      </section>

      <section className="grid grid-cols-2 gap-5">
        <QueueCard
          eyebrow="Act first"
          title="Overdue"
          empty="No overdue tasks. Perfect discipline."
          items={overdueTasks.items.map((t) => ({
            id: t.id,
            clientId: t.clientId,
            title: t.title,
            client: t.client.name,
            type: t.type.replace("_", " "),
            chip: "danger" as const,
            chipLabel: formatRelative(t.dueDate),
          }))}
        />
        <QueueCard
          eyebrow="In the queue"
          title="Due today"
          empty="Nothing scheduled right now."
          items={todayTasks.items.map((t) => ({
            id: t.id,
            clientId: t.clientId,
            title: t.title,
            client: t.client.name,
            type: t.type.replace("_", " "),
            chip: "quiet" as const,
            chipLabel: formatRelative(t.dueDate),
          }))}
        />
      </section>

      <section>
        <SectionHead
          eyebrow="Customer Journey"
          title="My pipeline"
          hint={
            totalFunnel > 0
              ? `${totalFunnel} clients across active stages`
              : "No one in the funnel yet"
          }
          action={<LinkCta href="/pipeline">Open the board</LinkCta>}
        />
        <div className="surface-flat p-10">
          <JourneyRibbon steps={steps} totalHint={totalFunnel || 1} />
        </div>
      </section>

      <section>
        <SectionHead
          eyebrow="Recent"
          title="Your clients"
          action={<LinkCta href="/clients">All clients</LinkCta>}
        />
        {topClients.items.length === 0 ? (
          <div className="surface-flat">
            <Empty>No clients assigned to you yet.</Empty>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {topClients.items.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="surface-flat p-6 group hover:shadow-card focus-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="initial-badge h-10 w-10 text-[13px] shrink-0">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-[18px] leading-tight tracking-tight-2 truncate">
                        {c.name}
                      </p>
                      <p className="text-[11px] uppercase tracking-wide-2 text-ink-3 mt-0.5">
                        {stageMap.get(c.stage)?.label ?? c.stage}
                      </p>
                    </div>
                  </div>
                  {c.tier === "VIP" ? (
                    <span className="chip-accent">VIP</span>
                  ) : c.tier === "PRIORITY" ? (
                    <span className="chip-accent">Priority</span>
                  ) : null}
                </div>
                <p className="mt-5 text-[12px] text-ink-3">
                  Updated {formatRelative(c.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function QueueCard({
  eyebrow,
  title,
  items,
  empty,
}: {
  eyebrow: string;
  title: string;
  empty: string;
  items: {
    id: string;
    clientId: string;
    title: string;
    client: string;
    type: string;
    chip: "danger" | "quiet";
    chipLabel: string;
  }[];
}) {
  return (
    <div className="surface-flat">
      <div className="px-7 pt-6 pb-4">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1 font-display text-[22px] leading-tight tracking-tight-2">
          {title}
        </h2>
      </div>
      {items.length === 0 ? (
        <Empty>{empty}</Empty>
      ) : (
        <ul className="px-2 pb-2">
          {items.map((t) => (
            <li key={t.id}>
              <Link
                href={`/clients/${t.clientId}`}
                className="flex items-start justify-between gap-4 rounded-xl px-5 py-4 row-hover focus-card"
              >
                <div className="min-w-0">
                  <p className="text-[14px] text-ink truncate">{t.title}</p>
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink-3 mt-1">
                    {t.client} · {t.type}
                  </p>
                </div>
                <span className={t.chip === "danger" ? "chip-danger" : "chip-quiet"}>
                  {t.chipLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
