import Link from "next/link";
import { requireUserForPage } from "@/lib/auth/guard";
import * as clientsApi from "@/modules/clients/api";
import { paginationQuery } from "@/lib/validators/common";
import { clientFilterSchema } from "@/lib/validators/client";
import { formatRelative } from "@/lib/utils/format";
import { PIPELINE_LABEL } from "@/lib/constants";
import { ClientFilters } from "./ClientFilters";

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">Roster</p>
          <h1 className="font-serif text-3xl mt-1">Clients</h1>
          <p className="text-sm text-bone/50 mt-2">{total.toLocaleString()} records</p>
        </div>
        <Link href="/clients/new" className="btn-primary">
          New Client
        </Link>
      </div>

      <ClientFilters initial={{ q: pagination.q, stage: filters.stage, tier: filters.tier }} />

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/50 border-b border-line">
            <tr className="text-left">
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Stage</Th>
              <Th>Tier</Th>
              <Th>Owner</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-bone/40">
                  No clients match the current filters.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="hover:bg-ink/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/clients/${c.id}`} className="font-serif text-lg hover:text-gold">
                      {c.name}
                    </Link>
                    {c.tier === "VIP" ? <span className="pill-gold ml-2 align-middle">VIP</span> : null}
                  </td>
                  <td className="px-6 py-4 text-bone/70 font-mono text-xs">{c.phone}</td>
                  <td className="px-6 py-4">
                    <span className="pill-muted">{PIPELINE_LABEL[c.stage]}</span>
                  </td>
                  <td className="px-6 py-4 text-bone/70">{c.tier}</td>
                  <td className="px-6 py-4 text-bone/70">{c.owner?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-bone/50 text-xs">{formatRelative(c.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 font-normal text-[10px] uppercase tracking-widest text-bone/50">
      {children}
    </th>
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
      <p className="text-[11px] uppercase tracking-widest text-bone/40">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={mk(Math.max(1, page - 1))}
          className={`btn-ghost ${page === 1 ? "opacity-30 pointer-events-none" : ""}`}
        >
          Previous
        </Link>
        <Link
          href={mk(Math.min(totalPages, page + 1))}
          className={`btn-ghost ${page === totalPages ? "opacity-30 pointer-events-none" : ""}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
