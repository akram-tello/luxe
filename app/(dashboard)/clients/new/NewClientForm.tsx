"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createClientAction } from "./actions";

type Owner = { id: string; name: string; role: string };

const initial = { error: undefined } as { error?: string };

export function NewClientForm({
  owners,
  defaultOwnerId,
  canChooseOwner,
}: {
  owners: Owner[];
  defaultOwnerId: string;
  canChooseOwner: boolean;
}) {
  const [state, formAction] = useFormState(createClientAction, initial);
  return (
    <form action={formAction} className="surface-flat p-10 space-y-8">
      <div className="grid grid-cols-2 gap-5">
        <Field label="Full name" name="name" required />
        <Field label="Phone" name="phone" required placeholder="+41 22 000 00 00" />
        <Field label="Email" name="email" type="email" />
        <div>
          <label className="eyebrow block mb-2">Tier</label>
          <select name="tier" className="select" defaultValue="STANDARD">
            <option value="STANDARD">Standard</option>
            <option value="PRIORITY">Priority</option>
            <option value="VIP">VIP</option>
          </select>
        </div>
        <Field label="Birthday" name="birthday" type="date" />
        <Field label="Anniversary" name="anniversary" type="date" />
      </div>

      <div className="divider" />

      <div>
        <label className="eyebrow block mb-2">Assigned associate</label>
        <select
          name="ownerId"
          defaultValue={defaultOwnerId}
          className="select"
          disabled={!canChooseOwner}
        >
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {o.role}
            </option>
          ))}
        </select>
        {!canChooseOwner ? (
          <p className="text-[11px] text-ink-3 mt-2">
            Associates may only create clients assigned to themselves.
          </p>
        ) : null}
      </div>

      <div>
        <label className="eyebrow block mb-2">Notes</label>
        <textarea
          name="notes"
          rows={4}
          className="textarea"
          placeholder="Preferences, introducer, context…"
        />
      </div>

      {state?.error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          {state.error}
        </div>
      ) : null}

      <Submit />
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <div className="flex justify-end gap-3">
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Creating…" : "Create client"}
      </button>
    </div>
  );
}
