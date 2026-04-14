"use client";

import { useFormState, useFormStatus } from "react-dom";
import { advanceStageAction } from "./actions";

const initial = { error: undefined, message: undefined } as {
  error?: string;
  message?: string;
};

type StageOption = { key: string; label: string; kind: "ACTIVE" | "WON" | "LOST" };

export function StageAdvancer({
  clientId,
  currentStage,
  currentStageLabel,
  stages,
  nextKey,
  isManager,
}: {
  clientId: string;
  currentStage: string;
  currentStageLabel: string;
  stages: StageOption[];
  nextKey: string | null;
  isManager: boolean;
}) {
  const [state, action] = useFormState(advanceStageAction.bind(null, clientId), initial);

  const lostKey = stages.find((s) => s.kind === "LOST")?.key ?? null;
  const next = nextKey ?? lostKey;

  const options = isManager
    ? stages
    : stages.filter((s) => s.key === nextKey || s.kind === "LOST");

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <p className="eyebrow mb-2">Current</p>
          <p className="font-display text-[22px] leading-none tracking-tight-2 font-normal">
            {currentStageLabel}
          </p>
        </div>
        <div>
          <label className="eyebrow block mb-2">Advance to</label>
          <select name="stage" className="select" defaultValue={next ?? ""}>
            {options
              .filter((s) => s.key !== currentStage)
              .map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
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
