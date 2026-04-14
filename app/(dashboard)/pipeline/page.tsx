import Link from "next/link";
import { requireUserForPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { getActiveStages } from "@/lib/constants";
import { formatRelative, initials } from "@/lib/utils/format";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "../_components/primitives";

export default async function PipelineBoard() {
  const actor = await requireUserForPage();
  const where =
    actor.role === ("ASSOCIATE" as UserRole)
      ? { ownerId: actor.id, deletedAt: null }
      : { deletedAt: null };

  const [clients, stages] = await Promise.all([
    prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        tier: true,
        stage: true,
        updatedAt: true,
        lastContactAt: true,
        owner: { select: { name: true } },
      },
      orderBy: [{ tier: "desc" }, { updatedAt: "desc" }],
      take: 500,
    }),
    getActiveStages(),
  ]);

  const grouped = new Map<string, typeof clients>();
  for (const s of stages) grouped.set(s.key, []);
  for (const c of clients) {
    if (!grouped.has(c.stage)) grouped.set(c.stage, []);
    grouped.get(c.stage)!.push(c);
  }

  const total = clients.length || 1;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Flow"
        title="Pipeline"
        subtitle={`${clients.length} clients moving through the house.`}
      />

      <div
        className="grid gap-4 items-start"
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
      >
        {stages.map((stage) => {
          const items = grouped.get(stage.key) ?? [];
          const pct = ((items.length / total) * 100).toFixed(0);
          const isLost = stage.kind === "LOST";
          return (
            <div key={stage.key} className="surface-flat flex flex-col min-h-[520px] max-h-[720px]">
              <div className="px-4 pt-5 pb-3">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">{stage.label}</p>
                  <span className="numeric text-[11px] text-ink-3">
                    {items.length}
                  </span>
                </div>
                <div className="mt-3 h-[2px] bg-hair rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isLost ? "bg-danger/40" : "bg-ink"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-2">
                {items.length === 0 ? (
                  <p className="px-2 py-6 text-[12px] text-ink-3 text-center italic">
                    Empty
                  </p>
                ) : (
                  items.slice(0, 24).map((c) => (
                    <Link
                      key={c.id}
                      href={`/clients/${c.id}`}
                      className="block rounded-xl px-3 py-3 bg-paper-soft/50 border border-hair hover:bg-chalk hover:border-hair-2 hover:shadow-soft focus-card"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="initial-badge h-7 w-7 text-[10px] shrink-0">
                          {initials(c.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-display text-[14px] leading-tight tracking-tight-2 truncate">
                              {c.name}
                            </p>
                            {c.tier === "VIP" ? (
                              <span className="text-[9px] uppercase tracking-wide-2 text-accent-deep shrink-0">
                                VIP
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[10px] uppercase tracking-wide-2 text-ink-3 mt-1 truncate">
                            {c.owner?.name ?? "Unassigned"}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-ink-4 mt-2">
                        {formatRelative(c.lastContactAt ?? c.updatedAt)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
