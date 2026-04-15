"use client";

import { useFormState, useFormStatus } from "react-dom";
import { confirmEnrollmentAction } from "../../login/actions";

const initial = { error: undefined } as { error?: string };

export function EnrollForm() {
  const [state, action] = useFormState(confirmEnrollmentAction, initial);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="eyebrow block mb-2" htmlFor="code">
          Six-digit code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          className="input numeric tracking-[0.3em] text-center"
          placeholder="000000"
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

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-gold btn-lg w-full" disabled={pending}>
      {pending ? "Confirming…" : "Confirm and continue"}
    </button>
  );
}
