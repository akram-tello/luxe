"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "./actions";

const initial = { error: undefined } as { error?: string };

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initial);
  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="label block mb-2" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="name@boutique.com"
        />
      </div>
      <div>
        <label className="label block mb-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
        />
      </div>
      {state?.error ? (
        <p className="text-[11px] uppercase tracking-widest text-danger border border-danger/60 bg-danger/10 px-4 py-2">
          {state.error}
        </p>
      ) : null}
      <SubmitBtn />
    </form>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Signing in…" : "Enter the Boutique"}
    </button>
  );
}
