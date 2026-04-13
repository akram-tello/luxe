import Link from "next/link";
import { requireUserForPage } from "@/lib/auth/guard";
import { listAssignableUsers } from "@/server/services/auth";
import { NewClientForm } from "./NewClientForm";
import { PageHeader } from "../../_components/primitives";

export default async function NewClientPage() {
  const actor = await requireUserForPage();
  const owners = await listAssignableUsers(actor);
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-ink"
      >
        <span aria-hidden>←</span> All clients
      </Link>
      <PageHeader
        eyebrow="Register"
        title="New client"
        subtitle="Every client must be assigned to an associate. The system logs creation and enforces first-contact SLA."
      />
      <NewClientForm
        owners={owners.map((o) => ({ id: o.id, name: o.name, role: o.role }))}
        defaultOwnerId={actor.id}
        canChooseOwner={actor.role === "MANAGER"}
      />
    </div>
  );
}
