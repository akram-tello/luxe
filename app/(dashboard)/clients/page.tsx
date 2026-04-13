import Link from "next/link";
import { requireUserForPage } from "@/lib/auth/guard";
import * as clientsApi from "@/modules/clients/api";
import { paginationQuery } from "@/lib/validators/common";
import { clientFilterSchema } from "@/lib/validators/client";
import { formatRelative, initials } from "@/lib/utils/format";
import { PIPELINE_LABEL } from "@/lib/constants";
import { ClientFilters } from "./ClientFilters";
import { PageHeader, Empty } from "../_components/primitives";

type Search = { [key: string]: string | string[] | undefined };

export default async function ClientsIndex({ searchParams }: { searchParams: Search }) {
  const actor = await requireUserForPage();
  const pagination = paginationQuery.parse({
    page: first(searchParams.page) ?? "1",
    pageSize: first(searchParams.pageSize) ?? "25",
    q: first(searchParams.q),
  });
  const filters = clientFilterSchema.parse({
    stage: first(searchParams.stage),
    tier: first(searchParams.tier),
    ownerId: first(searchParams.ownerId),
  });

  const { items, total, page, pageSize } = await clientsApi.list(actor, pagination, filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Roster"
        title="Clients"
        subtitle={`${total.toLocaleString()} records · filtered, owned, audited.`}
        actions={
          <Link href="/clients/new" className="btn-primary">
            New client
          </Link>
        }
      />

      <ClientFilters initial={{ q: pagination.q, stage: filters.stage, tier: filters.tier }} />

      <div className="surface-flat overflow-hidden">
        <div className="grid grid-cols-[2.2fr_1fr_1fr_0.8fr_1fr_1fr] items-center px-7 pt-5 pb-3 text-[10px] uppercase tracking-wide-3 text-ink-4">
          <span>Client</span>
          <span>Phone</span>
          <span>Stage</span>
          <span>Tier</span>
          <span>Owner</span>
          <span className="text-right">Updated</span>
        </div>
        <div className="divider" />
        {items.length === 0 ? (
          <Empty>No clients match the current filters.</Empty>
        ) : (
          <ul>
            {items.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="grid grid-cols-[2.2fr_1fr_1fr_0.8fr_1fr_1fr] items-center gap-4 px-7 py-5 row-hover focus-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="initial-badge h-10 w-10 text-[13px] shrink-0">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-[17px] leading-tight tracking-tight-2 truncate">
                        {c.name}
                        {c.tier === "VIP" ? (
                          <span className="chip-accent ml-2 align-middle translate-y-[-1px]">
                            VIP
                          </span>
                        ) : null}
                      </p>
                      {c.email ? (
                        <p className="text-[11px] text-ink-3 mt-0.5 truncate">
                          {c.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="numeric text-[12px] text-ink-2">{c.phone}</p>
                  <p className="text-[13px] text-ink-2">{PIPELINE_LABEL[c.stage]}</p>
                  <p className="text-[13px] text-ink-3">{c.tier}</p>
                  <p className="text-[13px] text-ink-3 truncate">
                    {c.owner?.name ?? "—"}
                  </p>
                  <p className="text-[12px] text-ink-3 text-right">
                    {formatRelative(c.updatedAt)}
                  </p>
                </Link>
                {i < items.length - 1 ? (
                  <div className="mx-7 divider" />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Search;
}) {
  const mk = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (typeof v === "string") params.set(k, v);
    }
    params.set("page", String(p));
    return `?${params.toString()}`;
  };
  return (
    <div className="flex items-center justify-between">
      <p className="text-[12px] text-ink-3 numeric">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={mk(Math.max(1, page - 1))}
          className={`btn-ghost btn-sm ${page === 1 ? "opacity-30 pointer-events-none" : ""}`}
        >
          ← Previous
        </Link>
        <Link
          href={mk(Math.min(totalPages, page + 1))}
          className={`btn-ghost btn-sm ${page === totalPages ? "opacity-30 pointer-events-none" : ""}`}
        >
          Next →
        </Link>
      </div>
    </div>
  );
}

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
