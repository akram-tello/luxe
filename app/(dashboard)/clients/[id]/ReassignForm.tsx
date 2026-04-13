"use client";

import { useFormState, useFormStatus } from "react-dom";
import { reassignAction } from "./actions";

type U = { id: string; name: string; role: string };
const initial = { error: undefined, message: undefined } as { error?: string; message?: string };

export function ReassignForm({
  clientId,
  currentOwnerId,
  users,
}: {
  clientId: string;
  currentOwnerId: string;
  users: U[];
}) {
  const [state, action] = useFormState(reassignAction.bind(null, clientId), initial);
  return (
    <form action={action} className="space-y-3">
      <select name="ownerId" className="select" defaultValue={currentOwnerId}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {u.role}
          </option>
        ))}
      </select>
      <textarea name="reason" rows={2} required minLength={3} className="textarea" placeholder="Reason (audited)" />
      {state?.error ? (
        <p className="text-[11px] uppercase tracking-widest text-danger">{state.error}</p>
      ) : null}
      {state?.message ? (
        <p className="text-[11px] uppercase tracking-widest text-success">{state.message}</p>
      ) : null}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-ghost w-full" type="submit" disabled={pending}>
      {pending ? "Reassigning…" : "Reassign"}
    </button>
  );
}
