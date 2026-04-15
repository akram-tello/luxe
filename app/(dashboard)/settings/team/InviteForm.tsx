"use client";

import { useFormState, useFormStatus } from "react-dom";
import { inviteAssociateAction } from "./actions";

const initial = {
  error: undefined,
  message: undefined,
  inviteUrl: undefined,
} as { error?: string; message?: string; inviteUrl?: string };

export function InviteForm() {
  const [state, action] = useFormState(inviteAssociateAction, initial);
  return (
    <form action={action} className="space-y-4">
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
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label className="eyebrow block mb-2" htmlFor="email">
          Valiram email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          pattern=".+@valiram\.com"
          title="Must be a @valiram.com address"
          className="input"
          placeholder="associate@valiram.com"
        />
      </div>
      {state?.error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          {state.error}
        </div>
      ) : null}
      {state?.message ? (
        <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-[13px] text-success">
          {state.message}
        </div>
      ) : null}
      {state?.inviteUrl ? (
        <div className="rounded-xl border border-gold/40 bg-gold/5 px-4 py-3">
          <p className="eyebrow text-gold-deep dark:text-gold-soft">Invite link</p>
          <code className="numeric mt-2 block text-[11.5px] text-ink-2 break-all">
            {state.inviteUrl}
          </code>
          <CopyButton url={state.inviteUrl} />
        </div>
      ) : null}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-gold w-full" disabled={pending}>
      {pending ? "Creating…" : "Create invitation"}
    </button>
  );
}

function CopyButton({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(url).catch(() => {})}
      className="btn-ghost btn-xs mt-3"
    >
      Copy link
    </button>
  );
}
