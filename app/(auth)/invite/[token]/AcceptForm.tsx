"use client";

import { useFormState, useFormStatus } from "react-dom";
import { acceptInvitationAction } from "./actions";

const initial = { error: undefined } as { error?: string };

export function AcceptForm({ token }: { token: string }) {
  const [state, action] = useFormState(acceptInvitationAction, initial);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="eyebrow block mb-2" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          className="input"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="eyebrow block mb-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="input"
          placeholder="Minimum 10 characters"
        />
      </div>
      {state?.error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          {state.error}
        </div>
      ) : null}
      <Submit />
      <p className="text-[11.5px] text-ink-4 text-center">
        After setting your password you&apos;ll be asked to scan a QR code to
        enable two-factor authentication.
      </p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary btn-lg w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}
