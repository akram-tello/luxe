"use client";

import { useFormState, useFormStatus } from "react-dom";
import { logActivityAction } from "./actions";

const initial = { error: undefined, message: undefined } as {
  error?: string;
  message?: string;
};

const TYPES = [
  { value: "NOTE", label: "Note" },
  { value: "CALL", label: "Call" },
  { value: "MESSAGE", label: "Message" },
  { value: "APPOINTMENT", label: "Appointment" },
];

export function ActivityLogger({ clientId }: { clientId: string }) {
  const [state, action] = useFormState(logActivityAction.bind(null, clientId), initial);
  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-[160px_1fr] gap-3">
        <select name="type" className="select" defaultValue="NOTE">
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input name="summary" required className="input" placeholder="Summary (required)" />
      </div>
      <textarea name="body" rows={2} className="textarea" placeholder="Details (optional)" />
      {state?.error ? (
        <p className="text-[12px] text-danger">{state.error}</p>
      ) : null}
      {state?.message ? (
        <p className="text-[12px] text-success">{state.message}</p>
      ) : null}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <div className="flex justify-end">
      <button className="btn-primary btn-sm" type="submit" disabled={pending}>
        {pending ? "Logging…" : "Log activity"}
      </button>
    </div>
  );
}
