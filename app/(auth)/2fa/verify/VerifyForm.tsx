"use client";

import { useFormState, useFormStatus } from "react-dom";
import { verifyCodeAction } from "../../login/actions";

const initial = { error: undefined } as { error?: string };

export function VerifyForm() {
  const [state, action] = useFormState(verifyCodeAction, initial);
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
          autoFocus
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
    <button type="submit" className="btn-primary btn-lg w-full" disabled={pending}>
      {pending ? "Verifying…" : "Sign in"}
    </button>
  );
}
