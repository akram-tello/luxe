"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createTemplateAction } from "./actions";

const initial = { error: undefined, message: undefined } as { error?: string; message?: string };

export function TemplateEditor() {
  const [state, action] = useFormState(createTemplateAction, initial);
  return (
    <form action={action} className="space-y-3 mt-4">
      <input name="name" required className="input" placeholder="Name" />
      <input name="category" required className="input" placeholder="Category (e.g. WELCOME)" />
      <textarea
        name="body"
        required
        rows={6}
        className="textarea"
        placeholder="Message body with {{client_name}}, {{associate_name}}, {{store_name}}, {{wishlist_item}}"
      />
      <input
        name="variables"
        required
        className="input"
        placeholder="Variables (comma-separated, e.g. client_name,store_name)"
      />
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
    <button className="btn-primary w-full" type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create template"}
    </button>
  );
}
