"use client";

import { useFormState, useFormStatus } from "react-dom";
import { renderMessageAction, type RenderMessageState } from "./actions";

type Tpl = { id: string; name: string; category: string };

const initial: RenderMessageState = {};

export function MessageComposer({ clientId, templates }: { clientId: string; templates: Tpl[] }) {
  const [state, action] = useFormState(renderMessageAction.bind(null, clientId), initial);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3">
        <div>
          <label className="eyebrow block mb-2">Template</label>
          <select name="templateId" className="select" required>
            {templates.length === 0 ? (
              <option value="">No templates available</option>
            ) : (
              templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.category} — {t.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className="eyebrow block mb-2">Wishlist item (optional)</label>
          <input
            name="wishlist_item"
            className="input"
            placeholder="e.g. Royal Oak 15500ST"
          />
        </div>
        {state?.error ? (
          <p className="text-[12px] text-danger">{state.error}</p>
        ) : null}
        <Submit />
      </form>

      {state?.text ? (
        <div className="rounded-xl border border-hair-2 bg-paper-soft/60 p-4 space-y-3">
          <p className="eyebrow">Preview</p>
          <p className="text-[13px] whitespace-pre-wrap text-pretty text-ink-2">
            {state.text}
          </p>
          {state.whatsAppUrl ? (
            <a
              href={state.whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent btn-sm inline-flex"
            >
              Open in WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-ghost w-full" type="submit" disabled={pending}>
      {pending ? "Preparing…" : "Prepare message"}
    </button>
  );
}
