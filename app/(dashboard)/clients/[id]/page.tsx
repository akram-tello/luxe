import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserForPage } from "@/lib/auth/guard";
import * as clientsApi from "@/modules/clients/api";
import { listTemplates } from "@/server/services/templates";
import { listAssignableUsers } from "@/server/services/auth";
import { getActiveStages, getStageMap, nextStage as getNextStage, isLostStage } from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelative,
  initials,
} from "@/lib/utils/format";
import { NotFoundError } from "@/lib/errors";
import { StageAdvancer } from "./StageAdvancer";
import { ActivityLogger } from "./ActivityLogger";
import { MessageComposer } from "./MessageComposer";
import { SaleForm } from "./SaleForm";
import { ReassignForm } from "./ReassignForm";
import { ClientTabs } from "./ClientTabs";
import { SectionHead, Empty } from "../../_components/primitives";
import { ClientJourneyBoard } from "../../_components/ClientJourneyBoard";

const ACTIVITY_LABEL: Record<string, string> = {
  NOTE: "Note",
  CALL: "Call",
  MESSAGE: "Message",
  APPOINTMENT: "Appointment",
  STAGE_CHANGE: "Stage change",
  SALE: "Sale",
  SERVICE: "Service",
};

export default async function ClientDetail({ params }: { params: { id: string } }) {
  const actor = await requireUserForPage();
  let data;
  try {
    data = await clientsApi.detail(params.id, actor);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const { client, activities, sales, stageHistory, openTasks } = data;
  const [templates, assignable, activeStages, stageMap, nextStageRecord, lost] = await Promise.all([
    listTemplates(),
    actor.role === "MANAGER" ? listAssignableUsers(actor) : Promise.resolve([]),
    getActiveStages(),
    getStageMap(),
    getNextStage(client.stage),
    isLostStage(client.stage),
  ]);

  const lifetime = sales.reduce((s, x) => s + Number(x.amount), 0);
  const isLost = lost;
  const stageLabelMap = new Map(Array.from(stageMap.entries()).map(([k, v]) => [k, v.label]));
  const currentLabel = stageMap.get(client.stage)?.label ?? client.stage;
  const stageOptions = activeStages.map((s) => ({ key: s.key, label: s.label, kind: s.kind }));
  const journeyStages = activeStages.map((s) => ({
    key: s.key,
    label: s.label,
    kind: s.kind,
    steps: s.steps
      .filter((st) => st.active)
      .map((st) => ({ id: st.id, title: st.title })),
  }));

  const phoneHref = client.phone ? `tel:${client.phone.replace(/\s+/g, "")}` : undefined;
  const emailHref = client.email ? `mailto:${client.email}` : undefined;

  /* ---------- Panels ---------- */
  const activityPanel = (
    <div className="space-y-5">
      <div className="surface-flat p-5">
        <SectionHead eyebrow="Log" title="New activity" />
        <ActivityLogger clientId={client.id} />
      </div>
      <div className="surface-flat">
        {activities.length === 0 ? (
          <Empty>No activity recorded.</Empty>
        ) : (
          <ul className="px-6 py-5 space-y-5">
            {activities.map((a, idx) => (
              <li key={a.id} className="grid grid-cols-[auto_1fr_auto] gap-4 relative">
                <div className="flex flex-col items-center">
                  <span className="h-2 w-2 rounded-full bg-ink mt-1.5 shrink-0" />
                  {idx < activities.length - 1 ? (
                    <span className="w-px flex-1 bg-hair mt-1" />
                  ) : null}
                </div>
                <div className="pb-1 min-w-0">
                  <p className="eyebrow text-ink-2">
                    {ACTIVITY_LABEL[a.type] ?? a.type.replace("_", " ")}
                  </p>
                  <p className="text-[13.5px] text-ink mt-1 text-pretty">{a.summary}</p>
                  {a.body ? (
                    <p className="text-[12.5px] text-ink-3 mt-1 whitespace-pre-wrap text-pretty">
                      {a.body}
                    </p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink-3">
                    {formatRelative(a.occurredAt)}
                  </p>
                  <p className="text-[11px] text-ink-4 mt-0.5">{a.actor.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const tasksPanel = (
    <div className="surface-flat">
      {openTasks.length === 0 ? (
        <Empty>No open tasks.</Empty>
      ) : (
        <ul className="p-2">
          {openTasks.map((t) => {
            const overdue = t.dueDate < new Date();
            return (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl row-hover">
                <div className="min-w-0">
                  <p className="text-[13.5px] text-ink truncate">{t.title}</p>
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink-3 mt-1">
                    {t.type.replace("_", " ")}
                  </p>
                </div>
                <span className={overdue ? "chip-danger" : "chip-quiet"}>
                  {formatRelative(t.dueDate)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const salesPanel = (
    <div className="space-y-5">
      <div className="surface-flat">
        {sales.length === 0 ? (
          <Empty>No sales recorded.</Empty>
        ) : (
          <ul className="p-2">
            {sales.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl row-hover">
                <div className="min-w-0">
                  <p className="text-[13.5px] text-ink truncate">{s.product}</p>
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink-3 mt-1">
                    {formatDate(s.purchaseDate)} · {s.associate.name}
                  </p>
                </div>
                <p className="font-display text-[18px] leading-none tracking-tight-2 shrink-0">
                  {formatCurrency(Number(s.amount), s.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="surface-flat p-5">
        <SectionHead eyebrow="Record" title="New sale" />
        <SaleForm clientId={client.id} />
      </div>
    </div>
  );

  const historyPanel = (
    <div className="space-y-5">
      <div className="surface-flat p-5">
        <SectionHead eyebrow="Pipeline" title="Advance the journey" hint="A note is required — audited." />
        <StageAdvancer
          clientId={client.id}
          currentStage={client.stage}
          currentStageLabel={currentLabel}
          stages={stageOptions}
          nextKey={nextStageRecord?.key ?? null}
          isManager={actor.role === "MANAGER"}
        />
      </div>
      <div className="surface-flat p-5">
        <p className="eyebrow mb-3">History</p>
        {stageHistory.length === 0 ? (
          <p className="text-[13px] text-ink-3">No stage changes yet.</p>
        ) : (
          <ul className="space-y-4">
            {stageHistory.map((s) => (
              <li key={s.id} className="grid grid-cols-[auto_1fr_auto] gap-4">
                <span className="h-2 w-2 rounded-full bg-ink/40 mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] text-ink">
                    <span className="text-ink-3">{s.fromStage ? (stageLabelMap.get(s.fromStage) ?? s.fromStage) : "—"}</span>
                    <span className="mx-2 text-ink-4">→</span>
                    <span className="font-medium">{stageLabelMap.get(s.stage) ?? s.stage}</span>
                  </p>
                  <p className="text-[12px] text-ink-3 mt-1 text-pretty">{s.note}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink-3">
                    {formatDateTime(s.createdAt)}
                  </p>
                  <p className="text-[11px] text-ink-4 mt-0.5">by {s.changedBy.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const messagePanel = (
    <div className="surface-flat p-5">
      <SectionHead eyebrow="Messaging" title="Prepare message" hint="System prepares — never transmits." />
      <MessageComposer
        clientId={client.id}
        templates={templates.map((t) => ({ id: t.id, name: t.name, category: t.category }))}
      />
    </div>
  );

  const tabs = [
    { key: "activity", label: "Activity", count: activities.length },
    { key: "tasks", label: "Tasks", count: openTasks.length },
    { key: "sales", label: "Sales", count: sales.length },
    { key: "history", label: "History", count: stageHistory.length },
    { key: "message", label: "Message" },
  ];

  if (actor.role === "MANAGER") {
    tabs.push({ key: "ownership", label: "Ownership" });
  }

  const panels: Record<string, React.ReactNode> = {
    activity: activityPanel,
    tasks: tasksPanel,
    sales: salesPanel,
    history: historyPanel,
    message: messagePanel,
    ownership: (
      <div className="surface-flat p-5 max-w-xl">
        <SectionHead eyebrow="Ownership" title="Reassign" />
        <ReassignForm
          clientId={client.id}
          currentOwnerId={client.ownerId}
          users={assignable.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
        />
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-ink"
      >
        <span aria-hidden>←</span> All clients
      </Link>

      {/* Hero with one-click actions */}
      <header className="surface-flat p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            <div className="initial-badge h-14 w-14 text-[18px] shrink-0">
              {initials(client.name)}
            </div>
            <div className="min-w-0">
              <p className="eyebrow">Client</p>
              <h1 className="mt-1 font-display text-[34px] leading-[1.04] tracking-tight-1 font-normal text-balance">
                {client.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                {client.tier === "VIP" ? <span className="chip-accent">VIP</span> : null}
                {client.tier === "PRIORITY" ? <span className="chip-accent">Priority</span> : null}
                <span className="chip-quiet">{currentLabel}</span>
                {client.owner ? (
                  <span className="chip">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-3" />
                    {client.owner.name}
                  </span>
                ) : (
                  <span className="chip-warn">Unassigned</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div>
              <p className="eyebrow">Lifetime</p>
              <p className="font-display text-[22px] leading-none tracking-tight-1 mt-1">
                {formatCurrency(lifetime)}
              </p>
            </div>
            <span className="h-10 w-px bg-hair" />
            <div>
              <p className="eyebrow">Last contact</p>
              <p className="text-[13px] text-ink mt-1">{formatRelative(client.lastContactAt)}</p>
            </div>
          </div>
        </div>

        {/* Quick action row */}
        <div className="mt-5 pt-5 border-t border-hair flex items-center gap-2 flex-wrap">
          {phoneHref ? (
            <a href={phoneHref} className="btn-primary btn-sm">
              <IconPhone /> Call <span className="numeric text-[11.5px] opacity-80 ml-1">{client.phone}</span>
            </a>
          ) : (
            <button disabled className="btn-ghost btn-sm"><IconPhone /> No phone</button>
          )}
          {emailHref ? (
            <a href={emailHref} className="btn-ghost btn-sm">
              <IconMail /> Email
            </a>
          ) : null}
          <a href="#message" className="btn-ghost btn-sm">
            <IconChat /> Message
          </a>
          <a href="#activity" className="btn-ghost btn-sm">
            <IconPlus /> Log visit
          </a>
          {!isLost ? (
            <a href="#history" className="btn-ghost btn-sm">
              <IconArrow /> Advance stage
            </a>
          ) : null}
          {client.email ? (
            <span className="ml-auto text-[12px] text-ink-3 numeric truncate max-w-[220px]">
              {client.email}
            </span>
          ) : null}
        </div>
      </header>

      {/* Smart journey board */}
      <section className="surface-flat p-5">
        <SectionHead
          eyebrow="Customer journey"
          title="Where this client stands"
          hint="Completed, in progress, and what comes next."
        />
        <ClientJourneyBoard
          currentStage={client.stage}
          stages={journeyStages}
          stageLabels={stageLabelMap}
          stageHistory={stageHistory}
          openTasks={openTasks}
          recentActivities={activities.slice(0, 5)}
        />
        {isLost ? (
          <p className="mt-3 text-[12px] text-danger">Marked as lost — journey closed.</p>
        ) : null}
      </section>

      {/* Tabs */}
      <section>
        <ClientTabs tabs={tabs} panels={panels} initial="activity" />
      </section>
    </div>
  );
}

/* ---------- Icons ---------- */

function IconPhone() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.89.73 2.78a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.11-.45c.89.36 1.82.6 2.78.73A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
