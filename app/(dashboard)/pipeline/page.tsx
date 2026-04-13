import Link from "next/link";
import { requireUserForPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { PIPELINE_LABEL, PIPELINE_ORDER } from "@/lib/constants";
import { formatRelative } from "@/lib/utils/format";
import type { PipelineStage, UserRole } from "@prisma/client";

export default async function PipelineBoard() {
  const actor = await requireUserForPage();
  const where = actor.role === ("ASSOCIATE" as UserRole) ? { ownerId: actor.id, deletedAt: null } : { deletedAt: null };

  const clients = await prisma.client.findMany({
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
  });

  const grouped = new Map<PipelineStage, typeof clients>();
  for (const s of [...PIPELINE_ORDER, "LOST" as PipelineStage]) grouped.set(s, []);
  for (const c of clients) grouped.get(c.stage)?.push(c);

  return (
    <div className="space-y-8">
      <div>
        <p className="label">Flow</p>
        <h1 className="font-serif text-3xl mt-1">Pipeline Board</h1>
      </div>
      <div className="grid grid-cols-7 gap-4 overflow-x-auto">
        {[...PIPELINE_ORDER, "LOST" as PipelineStage].map((stage) => {
          const items = grouped.get(stage) ?? [];
          return (
            <div key={stage} className="panel p-4 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <p className="label">{PIPELINE_LABEL[stage]}</p>
                <p className="text-[10px] text-bone/50">{items.length}</p>
              </div>
              <div className="mt-3 space-y-3 flex-1">
                {items.length === 0 ? (
                  <p className="text-[11px] text-bone/30 italic">No clients</p>
                ) : (
                  items.slice(0, 20).map((c) => (
                    <Link
                      key={c.id}
                      href={`/clients/${c.id}`}
                      className="block border border-line p-3 hover:border-gold/40 bg-ink/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-serif">{c.name}</p>
                        {c.tier === "VIP" ? (
                          <span className="text-[9px] uppercase tracking-widest text-gold">VIP</span>
                        ) : null}
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-bone/40 mt-2">
                        {c.owner?.name ?? "Unassigned"}
                      </p>
                      <p className="text-[10px] text-bone/40 mt-0.5">
                        Contact {formatRelative(c.lastContactAt ?? c.updatedAt)}
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
