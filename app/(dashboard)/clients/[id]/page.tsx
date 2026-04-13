import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserForPage } from "@/lib/auth/guard";
import * as clientsApi from "@/modules/clients/api";
import { listTemplates } from "@/server/services/templates";
import { listAssignableUsers } from "@/server/services/auth";
import { PIPELINE_LABEL, PIPELINE_ORDER } from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelative,
  initials,
} from "@/lib/utils/format";
import { NotFoundError } from "@/lib/errors";
import type { PipelineStage } from "@prisma/client";
import { StageAdvancer } from "./StageAdvancer";
import { ActivityLogger } from "./ActivityLogger";
import { MessageComposer } from "./MessageComposer";
import { SaleForm } from "./SaleForm";
import { ReassignForm } from "./ReassignForm";
import { SectionHead, Empty } from "../../_components/primitives";

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
  const [templates, assignable] = await Promise.all([
    listTemplates(),
    actor.role === "MANAGER" ? listAssignableUsers(actor) : Promise.resolve([]),
  ]);

  const lifetime = sales.reduce((s, x) => s + Number(x.amount), 0);
  const currentIndex = PIPELINE_ORDER.indexOf(client.stage as PipelineStage);
  const isLost = client.stage === "LOST";

  return (
    <div className="space-y-10">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-ink"
      >
        <span aria-hidden>←</span> All clients
      </Link>

      {/* Hero */}
      <header className="surface-flat p-8">
        <div className="flex items-start justify-between gap-8">
          <div className="flex items-start gap-5 min-w-0">
            <div className="initial-badge h-16 w-16 text-[20px] shrink-0">
              {initials(client.name)}
            </div>
            <div className="min-w-0">
              <p className="eyebrow">Client</p>
              <h1 className="mt-2 font-display text-[40px] leading-[1.04] tracking-tight-3 font-light text-balance">
                {client.name}
              </h1>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {client.tier === "VIP" ? <span className="chip-accent">VIP</span> : null}
                {client.tier === "PRIORITY" ? (
                  <span className="chip-accent">Priority</span>
                ) : null}
                <span className="chip-quiet">{PIPELINE_LABEL[client.stage]}</span>
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
          <div className="text-right space-y-1 shrink-0">
            <p className="numeric text-[13px] text-ink">{client.phone}</p>
            {client.email ? (
              <p className="numeric text-[12px] text-ink-3">{client.email}</p>
            ) : null}
            <div className="mt-4 inline-flex items-center gap-3">
              <div>
                <p className="eyebrow">Lifetime</p>
                <p className="font-display text-[22px] leading-none tracking-tight-2 font-light mt-1">
                  {formatCurrency(lifetime)}
                </p>
              </div>
              <div className="w-px h-10 bg-hair" />
              <div>
                <p className="eyebrow">Last contact</p>
                <p className="text-[13px] text-ink mt-1">
                  {formatRelative(client.lastContactAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Journey stepper */}
        <div className="mt-10">
          <div className="relative">
            <div
              className="absolute top-[11px] left-0 right-0 h-px bg-hair-2"
              aria-hidden
            />
            <div className="absolute top-[11px] left-0 h-[2px] bg-ink transition-all"
              style={{
                width: isLost
                  ? "0%"
                  : `${Math.max(0, (currentIndex / (PIPELINE_ORDER.length - 1)) * 100)}%`,
              }}
              aria-hidden
            />
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${PIPELINE_ORDER.length}, minmax(0, 1fr))` }}
            >
              {PIPELINE_ORDER.map((stage, i) => {
                const done = !isLost && i < currentIndex;
                const current = !isLost && i === currentIndex;
                return (
                  <div key={stage} className="flex flex-col items-center gap-3">
                    <div className="relative z-10">
                      <div
                        className={`h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center ${
                          done
                            ? "bg-ink border-ink"
                            : current
                            ? "bg-chalk border-ink"
                            : "bg-chalk border-hair-3"
                        }`}
                      >
                        {done ? (
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="#F7F5F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1.5 5.5l2 2 5-5" />
                          </svg>
                        ) : current ? (
                          <span className="h-[8px] w-[8px] rounded-full bg-ink" />
                        ) : null}
                      </div>
                    </div>
                    <p className={`text-[11px] uppercase tracking-wide-2 text-center ${current ? "text-ink" : "text-ink-3"}`}>
                      {PIPELINE_LABEL[stage]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          {isLost ? (
            <p className="mt-6 text-[12px] text-danger">
              Marked as lost — journey closed.
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-[1fr_380px] gap-6">
        <div className="space-y-10 min-w-0">
          {/* Stage advancer */}
          <section className="surface-flat p-8">
            <SectionHead
              eyebrow="Pipeline"
              title="Advance the journey"
              hint="A note is required for every transition — audited."
            />
            <StageAdvancer
              clientId={client.id}
              currentStage={client.stage}
              isManager={actor.role === "MANAGER"}
            />
            <div className="mt-10">
              <p className="eyebrow mb-4">History</p>
              {stageHistory.length === 0 ? (
                <p className="text-[13px] text-ink-3">No stage changes yet.</p>
              ) : (
                <ul className="space-y-5">
                  {stageHistory.map((s) => (
                    <li key={s.id} className="grid grid-cols-[auto_1fr_auto] gap-4">
                      <span className="h-2 w-2 rounded-full bg-ink/40 mt-2 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[13px] text-ink">
                          <span className="text-ink-3">
                            {s.fromStage ? PIPELINE_LABEL[s.fromStage] : "—"}
                          </span>
                          <span className="mx-2 text-ink-4">→</span>
                          <span className="font-medium">{PIPELINE_LABEL[s.stage]}</span>
                        </p>
                        <p className="text-[12px] text-ink-3 mt-1 text-pretty">
                          {s.note}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] uppercase tracking-wide-2 text-ink-3">
                          {formatDateTime(s.createdAt)}
                        </p>
                        <p className="text-[11px] text-ink-4 mt-0.5">
                          by {s.changedBy.name}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Activity timeline */}
          <section className="surface-flat">
            <div className="p-8 pb-5">
              <SectionHead
                eyebrow="Timeline"
                title="Activity"
                hint="Every touchpoint, recorded."
              />
              <ActivityLogger clientId={client.id} />
            </div>
            <div className="divider" />
            {activities.length === 0 ? (
              <Empty>No activity recorded.</Empty>
            ) : (
              <ul className="px-8 py-6 space-y-6">
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
                      <p className="text-[14px] text-ink mt-1.5 text-pretty">
                        {a.summary}
                      </p>
                      {a.body ? (
                        <p className="text-[13px] text-ink-3 mt-1.5 whitespace-pre-wrap text-pretty">
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
          </section>
        </div>

        <aside className="space-y-6">
          <section className="surface-flat">
            <div className="p-6">
              <SectionHead eyebrow="Queue" title="Open tasks" />
            </div>
            <div className="divider" />
            {openTasks.length === 0 ? (
              <Empty>No open tasks.</Empty>
            ) : (
              <ul className="p-2">
                {openTasks.map((t) => {
                  const overdue = t.dueDate < new Date();
                  return (
                    <li key={t.id} className="rounded-xl px-4 py-3 row-hover">
                      <p className="text-[13px] text-ink">{t.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] uppercase tracking-wide-2 text-ink-3">
                          {t.type.replace("_", " ")}
                        </span>
                        <span className={overdue ? "chip-danger" : "chip-quiet"}>
                          {formatRelative(t.dueDate)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="surface-flat p-6">
            <SectionHead eyebrow="Messaging" title="Prepare message" />
            <MessageComposer
              clientId={client.id}
              templates={templates.map((t) => ({
                id: t.id,
                name: t.name,
                category: t.category,
              }))}
            />
          </section>

          <section className="surface-flat">
            <div className="p-6 pb-4">
              <SectionHead eyebrow="Revenue" title="Sales" />
            </div>
            <div className="divider" />
            {sales.length === 0 ? (
              <Empty>No sales recorded.</Empty>
            ) : (
              <ul className="px-2 py-2">
                {sales.map((s) => (
                  <li key={s.id} className="px-4 py-3 rounded-xl row-hover">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] text-ink min-w-0 truncate">{s.product}</p>
                      <p className="font-display text-[18px] leading-none tracking-tight-2 font-light shrink-0">
                        {formatCurrency(Number(s.amount), s.currency)}
                      </p>
                    </div>
                    <p className="text-[11px] uppercase tracking-wide-2 text-ink-3 mt-1">
                      {formatDate(s.purchaseDate)} · {s.associate.name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="divider" />
            <div className="p-6">
              <SaleForm clientId={client.id} />
            </div>
          </section>

          {actor.role === "MANAGER" ? (
            <section className="surface-flat p-6">
              <SectionHead eyebrow="Ownership" title="Reassign" />
              <ReassignForm
                clientId={client.id}
                currentOwnerId={client.ownerId}
                users={assignable.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
              />
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
