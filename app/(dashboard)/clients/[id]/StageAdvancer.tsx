"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { PipelineStage } from "@prisma/client";
import { advanceStageAction } from "./actions";
import { PIPELINE_LABEL, PIPELINE_ORDER, nextStage } from "@/lib/constants";

const initial = { error: undefined, message: undefined } as { error?: string; message?: string };

export function StageAdvancer({
  clientId,
  currentStage,
  isManager,
}: {
  clientId: string;
  currentStage: PipelineStage;
  isManager: boolean;
}) {
  const [state, action] = useFormState(advanceStageAction.bind(null, clientId), initial);
  const next = nextStage(currentStage);
  const options = isManager
    ? ([...PIPELINE_ORDER, "LOST"] as PipelineStage[])
    : next
      ? ([next, "LOST"] as PipelineStage[])
      : (["LOST"] as PipelineStage[]);

  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">Current stage</p>
          <p className="font-serif text-2xl mt-1">{PIPELINE_LABEL[currentStage]}</p>
        </div>
        <div className="flex-1 ml-8">
          <p className="label mb-2">Advance to</p>
          <select name="stage" className="select" defaultValue={next ?? "LOST"}>
            {options
              .filter((s) => s !== currentStage)
              .map((s) => (
                <option key={s} value={s}>
                  {PIPELINE_LABEL[s]}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label block mb-2">Note (required)</label>
        <textarea
          name="note"
          rows={3}
          required
          minLength={5}
          className="textarea"
          placeholder="Context for this transition (required for audit)"
        />
      </div>
      {isManager ? (
        <label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-bone/60">
          <input type="checkbox" name="force" className="accent-gold" /> Manager override (skip stages)
        </label>
      ) : null}
      {state?.error ? (
        <p className="text-[11px] uppercase tracking-widest text-danger border border-danger/60 bg-danger/10 px-4 py-2">
          {state.error}
        </p>
      ) : null}
      {state?.message ? (
        <p className="text-[11px] uppercase tracking-widest text-success border border-success/60 bg-success/5 px-4 py-2">
          {state.message}
        </p>
      ) : null}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Updating…" : "Advance stage"}
    </button>
  );
}
