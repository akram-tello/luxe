"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { PipelineStage } from "@prisma/client";
import { advanceStageAction } from "./actions";
import { PIPELINE_LABEL, PIPELINE_ORDER, nextStage } from "@/lib/constants";

const initial = { error: undefined, message: undefined } as {
  error?: string;
  message?: string;
};

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
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <p className="eyebrow mb-2">Current</p>
          <p className="font-display text-[22px] leading-none tracking-tight-2 font-normal">
            {PIPELINE_LABEL[currentStage]}
          </p>
        </div>
        <div>
          <label className="eyebrow block mb-2">Advance to</label>
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
        <label className="eyebrow block mb-2">Note (required)</label>
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
        <label className="flex items-center gap-2 text-[12px] text-ink-2">
          <input type="checkbox" name="force" className="accent-ink" />
          Manager override (skip stages)
        </label>
      ) : null}
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
