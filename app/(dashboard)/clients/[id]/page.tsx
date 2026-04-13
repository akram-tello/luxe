import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserForPage } from "@/lib/auth/guard";
import * as clientsApi from "@/modules/clients/api";
import { listTemplates } from "@/server/services/templates";
import { listAssignableUsers } from "@/server/services/auth";
import { PIPELINE_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime, formatRelative } from "@/lib/utils/format";
import { NotFoundError } from "@/lib/errors";
import { StageAdvancer } from "./StageAdvancer";
import { ActivityLogger } from "./ActivityLogger";
import { MessageComposer } from "./MessageComposer";
import { SaleForm } from "./SaleForm";
import { ReassignForm } from "./ReassignForm";

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

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-8">
        <div>
          <p className="label">Client</p>
          <h1 className="font-serif text-4xl mt-2">{client.name}</h1>
          <div className="flex items-center gap-3 mt-4">
            {client.tier === "VIP" ? <span className="pill-gold">VIP</span> : null}
            {client.tier === "PRIORITY" ? <span className="pill-gold">Priority</span> : null}
            <span className="pill-muted">{PIPELINE_LABEL[client.stage]}</span>
            <span className="text-xs text-bone/50">
              Assigned to {client.owner?.name ?? "unassigned"}
            </span>
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="font-mono text-xs text-bone/70">{client.phone}</p>
          {client.email ? <p className="font-mono text-xs text-bone/50">{client.email}</p> : null}
          <p className="text-[11px] uppercase tracking-widest text-bone/40 mt-3">
            Last contact {formatRelative(client.lastContactAt)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-10">
          <section>
            <SectionHeader title="Pipeline" />
            <div className="panel p-8">
              <StageAdvancer
                clientId={client.id}
                currentStage={client.stage}
                isManager={actor.role === "MANAGER"}
              />
              <div className="mt-8">
                <p className="label mb-3">History</p>
                <ul className="space-y-3">
                  {stageHistory.length === 0 ? (
                    <li className="text-bone/40 text-sm">No stage changes yet.</li>
                  ) : (
                    stageHistory.map((s) => (
                      <li key={s.id} className="flex items-start justify-between border-l border-line pl-4">
                        <div>
                          <p className="text-sm">
                            <span className="text-bone/50">
                              {s.fromStage ? PIPELINE_LABEL[s.fromStage] : "—"} →{" "}
                            </span>
                            <span>{PIPELINE_LABEL[s.stage]}</span>
                          </p>
                          <p className="text-xs text-bone/60 mt-1">{s.note}</p>
                        </div>
                        <p className="text-[11px] uppercase tracking-widest text-bone/40 whitespace-nowrap">
                          {formatDateTime(s.createdAt)} · {s.changedBy.name}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader title="Activity Timeline" />
            <div className="panel">
              <div className="p-6 border-b border-line">
                <ActivityLogger clientId={client.id} />
              </div>
              <ul className="divide-y divide-line">
                {activities.length === 0 ? (
                  <li className="p-6 text-bone/40 text-sm">No activity recorded.</li>
                ) : (
                  activities.map((a) => (
                    <li key={a.id} className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gold">{a.type.replace("_", " ")}</p>
                          <p className="text-sm mt-1">{a.summary}</p>
                          {a.body ? <p className="text-xs text-bone/60 mt-1 whitespace-pre-wrap">{a.body}</p> : null}
                        </div>
                        <div className="text-right ml-6">
                          <p className="text-[11px] uppercase tracking-widest text-bone/40">{formatRelative(a.occurredAt)}</p>
                          <p className="text-[10px] uppercase tracking-widest text-bone/30 mt-0.5">{a.actor.name}</p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section>
            <SectionHeader title="Open Tasks" />
            <div className="panel divide-y divide-line">
              {openTasks.length === 0 ? (
                <p className="p-6 text-bone/40 text-sm">No open tasks.</p>
              ) : (
                openTasks.map((t) => (
                  <div key={t.id} className="px-6 py-4">
                    <p className="text-sm">{t.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] uppercase tracking-widest text-bone/40">
                        {t.type.replace("_", " ")}
                      </span>
                      <span
                        className={
                          t.dueDate < new Date() ? "pill-danger" : "pill-muted"
                        }
                      >
                        {formatRelative(t.dueDate)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <SectionHeader title="Message" />
            <div className="panel p-6">
              <MessageComposer
                clientId={client.id}
                templates={templates.map((t) => ({ id: t.id, name: t.name, category: t.category }))}
              />
            </div>
          </section>

          <section>
            <SectionHeader title="Sales" />
            <div className="panel">
              <div className="divide-y divide-line">
                {sales.length === 0 ? (
                  <p className="p-6 text-bone/40 text-sm">No sales recorded.</p>
                ) : (
                  sales.map((s) => (
                    <div key={s.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{s.product}</p>
                        <p className="font-serif text-lg">
                          {formatCurrency(Number(s.amount), s.currency)}
                        </p>
                      </div>
                      <p className="text-[11px] uppercase tracking-widest text-bone/40 mt-1">
                        {formatDate(s.purchaseDate)} · {s.associate.name}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 border-t border-line">
                <SaleForm clientId={client.id} />
              </div>
            </div>
          </section>

          {actor.role === "MANAGER" ? (
            <section>
              <SectionHeader title="Reassign" />
              <div className="panel p-6">
                <ReassignForm
                  clientId={client.id}
                  currentOwnerId={client.ownerId}
                  users={assignable.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
                />
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Link href="/clients" className="btn-ghost">
          ← Back to clients
        </Link>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="hairline mt-3" />
    </div>
  );
}
