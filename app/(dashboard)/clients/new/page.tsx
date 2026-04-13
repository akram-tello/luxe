import { requireUserForPage } from "@/lib/auth/guard";
import { listAssignableUsers } from "@/server/services/auth";
import { NewClientForm } from "./NewClientForm";

export default async function NewClientPage() {
  const actor = await requireUserForPage();
  const owners = await listAssignableUsers(actor);
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <p className="label">Register</p>
        <h1 className="font-serif text-3xl mt-1">New Client</h1>
        <p className="text-sm text-bone/50 mt-2">
          Every client must be assigned to an associate. The system logs creation and enforces first-contact SLA.
        </p>
        <div className="hairline mt-6" />
      </div>
      <NewClientForm
        owners={owners.map((o) => ({ id: o.id, name: o.name, role: o.role }))}
        defaultOwnerId={actor.id}
        canChooseOwner={actor.role === "MANAGER"}
      />
    </div>
  );
}
