"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "./actions";

const initial = { error: undefined } as { error?: string };

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initial);
  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="eyebrow block mb-2" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@boutique.com"
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
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
        />
      </div>
      {state?.error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          {state.error}
        </div>
      ) : null}
      <SubmitBtn />
    </form>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary btn-lg w-full mt-2" disabled={pending}>
      {pending ? "Signing in…" : "Continue"}
    </button>
  );
}
