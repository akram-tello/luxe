"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import {
  createStageAction,
  updateStageAction,
  deleteStageAction,
  reorderStagesAction,
  createStepAction,
  updateStepAction,
  deleteStepAction,
  reorderStepsAction,
} from "./actions";

const initial: { error?: string; message?: string } = {};

type StepDTO = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  active: boolean;
};

type StageDTO = {
  id: string;
  key: string;
  label: string;
  kind: "ACTIVE" | "WON" | "LOST";
  order: number;
  stagnationDays: number;
  slaHours: number;
  color: string | null;
  active: boolean;
  steps: StepDTO[];
};

export function JourneyEditor({ stages }: { stages: StageDTO[] }) {
  const [openId, setOpenId] = useState<string | null>(stages[0]?.id ?? null);

  return (
    <div className="space-y-5">
      <StageList stages={stages} openId={openId} onOpen={setOpenId} />
      <NewStageCard />
    </div>
  );
}

/* -------------- Stage list with inline editors -------------- */

function StageList({
  stages,
  openId,
  onOpen,
}: {
  stages: StageDTO[];
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function move(id: string, dir: -1 | 1) {
    const idx = stages.findIndex((s) => s.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= stages.length) return;
    const next = [...stages];
    const [row] = next.splice(idx, 1);
    next.splice(target, 0, row!);
    setBusy(true);
    startTransition(async () => {
      await reorderStagesAction(next.map((s) => s.id));
      setBusy(false);
    });
  }

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const isOpen = openId === stage.id;
        return (
          <div key={stage.id} className="surface-flat overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0 || busy}
                  onClick={() => move(stage.id, -1)}
                  className="btn-icon-sm disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === stages.length - 1 || busy}
                  onClick={() => move(stage.id, 1)}
                  className="btn-icon-sm disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
              <span
                className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] numeric shrink-0"
                style={{
                  background: stage.color ?? "var(--chalk)",
                  color: "rgb(var(--ink))",
                }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display text-[18px] leading-tight tracking-tight-2">
                    {stage.label}
                  </p>
                  <KindChip kind={stage.kind} />
                  {!stage.active ? <span className="chip-warn">Inactive</span> : null}
                </div>
                <p className="text-[11px] uppercase tracking-wide-2 text-ink-3 mt-1">
                  {stage.key} · {stage.steps.length} step{stage.steps.length === 1 ? "" : "s"} ·
                  stagnate {stage.stagnationDays}d · SLA {stage.slaHours}h
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => onOpen(isOpen ? null : stage.id)}
              >
                {isOpen ? "Close" : "Edit"}
              </button>
            </div>
            {isOpen ? (
              <div className="border-t border-hair px-5 py-5 space-y-6">
                <StageEditForm stage={stage} />
                <StepEditor stage={stage} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function KindChip({ kind }: { kind: StageDTO["kind"] }) {
  if (kind === "WON") return <span className="chip-success">success</span>;
  if (kind === "LOST") return <span className="chip-danger">Lost</span>;
  return <span className="chip-quiet">Active</span>;
}

/* -------------- Stage edit -------------- */

function StageEditForm({ stage }: { stage: StageDTO }) {
  const [state, action] = useFormState(updateStageAction, initial);
  const [delState, delAction] = useFormState(deleteStageAction, initial);

  return (
    <div>
      <form action={action} className="grid grid-cols-2 gap-4">
        <input type="hidden" name="id" value={stage.id} />
        <div>
          <label className="eyebrow block mb-2">Label</label>
          <input name="label" className="input" defaultValue={stage.label} required />
        </div>
        <div>
          <label className="eyebrow block mb-2">Kind</label>
          <select name="kind" className="select" defaultValue={stage.kind}>
            <option value="ACTIVE">Active</option>
            <option value="WON">Won (terminal)</option>
            <option value="LOST">Lost (terminal)</option>
          </select>
        </div>
        <div>
          <label className="eyebrow block mb-2">Stagnation (days)</label>
          <input
            name="stagnationDays"
            type="number"
            min={0}
            className="input numeric"
            defaultValue={stage.stagnationDays}
            required
          />
        </div>
        <div>
          <label className="eyebrow block mb-2">SLA (hours)</label>
          <input
            name="slaHours"
            type="number"
            min={0}
            className="input numeric"
            defaultValue={stage.slaHours}
            required
          />
        </div>
        <div>
          <label className="eyebrow block mb-2">Accent colour</label>
          <input
            name="color"
            type="text"
            className="input"
            placeholder="#8B6F47"
            defaultValue={stage.color ?? ""}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-[13px] text-ink-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={stage.active}
              className="accent-ink"
            />
            Active (show in board &amp; filters)
          </label>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 pt-2">
          <div className="text-[12px]">
            {state?.error ? <span className="text-danger">{state.error}</span> : null}
            {state?.message ? <span className="text-success">{state.message}</span> : null}
          </div>
          <SaveBtn label="Save stage" />
        </div>
      </form>

      <div className="mt-4 pt-4 border-t border-hair flex items-center justify-between gap-3">
        <p className="text-[12px] text-ink-3">
          {delState?.error ? (
            <span className="text-danger">{delState.error}</span>
          ) : (
            "Deletion requires an empty stage — move clients first."
          )}
        </p>
        <form action={delAction}>
          <input type="hidden" name="id" value={stage.id} />
          <DeleteBtn label="Delete stage" />
        </form>
      </div>
    </div>
  );
}

/* -------------- Step editor -------------- */

function StepEditor({ stage }: { stage: StageDTO }) {
  const [, startTransition] = useTransition();

  function move(id: string, dir: -1 | 1) {
    const idx = stage.steps.findIndex((s) => s.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= stage.steps.length) return;
    const next = [...stage.steps];
    const [row] = next.splice(idx, 1);
    next.splice(target, 0, row!);
    startTransition(async () => {
      await reorderStepsAction(stage.id, next.map((s) => s.id));
    });
  }

  return (
    <section>
      <p className="eyebrow mb-3">Checklist / suggested steps</p>
      <ul className="space-y-2">
        {stage.steps.length === 0 ? (
          <li className="rounded-xl border border-dashed border-hair-3 p-4 text-[12px] text-ink-3 italic">
            No steps yet — add the sequence this stage should follow.
          </li>
        ) : (
          stage.steps.map((step, i) => (
            <StepRow key={step.id} step={step} first={i === 0} last={i === stage.steps.length - 1} onMove={move} />
          ))
        )}
      </ul>
      <NewStepRow stageId={stage.id} />
    </section>
  );
}

function StepRow({
  step,
  first,
  last,
  onMove,
}: {
  step: StepDTO;
  first: boolean;
  last: boolean;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useFormState(updateStepAction, initial);
  const [, delAction] = useFormState(deleteStepAction, initial);

  if (editing) {
    return (
      <li className="rounded-xl border border-hair-2 bg-chalk p-4">
        <form
          action={async (fd) => {
            await action(fd);
            setEditing(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={step.id} />
          <input
            name="title"
            className="input"
            defaultValue={step.title}
            required
            autoFocus
          />
          <textarea
            name="description"
            rows={2}
            className="textarea"
            defaultValue={step.description ?? ""}
            placeholder="Optional guidance for this step"
          />
          <label className="flex items-center gap-2 text-[12px] text-ink-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={step.active}
              className="accent-ink"
            />
            Active
          </label>
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px]">
              {state?.error ? <span className="text-danger">{state.error}</span> : null}
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <SaveBtn label="Save step" />
            </div>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-hair bg-paper-soft/40 px-4 py-3">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMove(step.id, -1)}
          disabled={first}
          className="btn-icon-sm disabled:opacity-30"
          aria-label="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(step.id, 1)}
          disabled={last}
          className="btn-icon-sm disabled:opacity-30"
          aria-label="Move down"
        >
          ↓
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] text-ink truncate">{step.title}</p>
        {step.description ? (
          <p className="text-[12px] text-ink-3 mt-0.5 truncate">{step.description}</p>
        ) : null}
      </div>
      {!step.active ? <span className="chip-warn">Inactive</span> : null}
      <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(true)}>
        Edit
      </button>
      <form action={delAction}>
        <input type="hidden" name="id" value={step.id} />
        <DeleteBtn label="Remove" />
      </form>
    </li>
  );
}

function NewStepRow({ stageId }: { stageId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createStepAction, initial);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost btn-sm mt-3"
      >
        + Add step
      </button>
    );
  }
  return (
    <form
      action={async (fd) => {
        await action(fd);
        setOpen(false);
      }}
      className="mt-3 rounded-xl border border-hair-2 bg-chalk p-4 space-y-3"
    >
      <input type="hidden" name="stageId" value={stageId} />
      <input name="title" className="input" placeholder="Step title" required autoFocus />
      <textarea
        name="description"
        rows={2}
        className="textarea"
        placeholder="Optional guidance"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px]">
          {state?.error ? <span className="text-danger">{state.error}</span> : null}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <SaveBtn label="Add step" />
        </div>
      </div>
    </form>
  );
}

/* -------------- New stage -------------- */

function NewStageCard() {
  const [state, action] = useFormState(createStageAction, initial);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        + Add stage
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setOpen(false);
      }}
      className="surface-flat p-5 grid grid-cols-2 gap-4"
    >
      <div>
        <label className="eyebrow block mb-2">Key</label>
        <input
          name="key"
          className="input numeric"
          placeholder="QUALIFIED"
          required
        />
        <p className="text-[11px] text-ink-3 mt-1">A–Z, 0–9, underscore. Cannot change later.</p>
      </div>
      <div>
        <label className="eyebrow block mb-2">Label</label>
        <input name="label" className="input" placeholder="Qualified" required />
      </div>
      <div>
        <label className="eyebrow block mb-2">Kind</label>
        <select name="kind" className="select" defaultValue="ACTIVE">
          <option value="ACTIVE">Active</option>
          <option value="WON">Won (terminal)</option>
          <option value="LOST">Lost (terminal)</option>
        </select>
      </div>
      <div>
        <label className="eyebrow block mb-2">Accent colour</label>
        <input name="color" className="input" placeholder="#8B6F47" />
      </div>
      <div>
        <label className="eyebrow block mb-2">Stagnation (days)</label>
        <input
          name="stagnationDays"
          type="number"
          min={0}
          defaultValue={5}
          className="input numeric"
          required
        />
      </div>
      <div>
        <label className="eyebrow block mb-2">SLA (hours)</label>
        <input
          name="slaHours"
          type="number"
          min={0}
          defaultValue={24}
          className="input numeric"
          required
        />
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 pt-2">
        <div className="text-[12px]">
          {state?.error ? <span className="text-danger">{state.error}</span> : null}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
            Cancel
          </button>
          <SaveBtn label="Create stage" />
        </div>
      </div>
    </form>
  );
}

/* -------------- buttons -------------- */

function SaveBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary btn-sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

function DeleteBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-ghost btn-sm text-danger" disabled={pending}>
      {pending ? "…" : label}
    </button>
  );
}
