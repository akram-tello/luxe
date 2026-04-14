import { cache } from "react";
import { prisma } from "@/lib/db/prisma";

/**
 * StageKey is a free-form string. Seeds give us PROSPECT … WON/LOST,
 * but managers can add their own keys via /settings/journey.
 */
export type StageKey = string;

export type StageKind = "ACTIVE" | "WON" | "LOST";

export type JourneyStageRecord = {
  id: string;
  key: StageKey;
  label: string;
  order: number;
  kind: StageKind;
  stagnationDays: number;
  slaHours: number;
  color: string | null;
  active: boolean;
  steps: JourneyStepRecord[];
};

export type JourneyStepRecord = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  active: boolean;
};

/**
 * Request-scoped fetch of the full journey config.
 * Includes inactive stages too (for admin screens) — consumers filter as needed.
 */
export const getJourneyConfig = cache(async (): Promise<JourneyStageRecord[]> => {
  const rows = await prisma.journeyStage.findMany({
    orderBy: { order: "asc" },
    include: {
      steps: {
        orderBy: { order: "asc" },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    order: r.order,
    kind: (r.kind as StageKind) ?? "ACTIVE",
    stagnationDays: r.stagnationDays,
    slaHours: r.slaHours,
    color: r.color,
    active: r.active,
    steps: r.steps.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      order: s.order,
      active: s.active,
    })),
  }));
});

/* ---------------- Convenience helpers (all request-cached) ---------------- */

export async function getActiveStages(): Promise<JourneyStageRecord[]> {
  const all = await getJourneyConfig();
  return all.filter((s) => s.active);
}

/** Ordered list of ACTIVE-kind stages (no WON / LOST). */
export async function getFunnelStages(): Promise<JourneyStageRecord[]> {
  const all = await getActiveStages();
  return all.filter((s) => s.kind === "ACTIVE");
}

/** Any terminal stage (WON or LOST). */
export async function getTerminalStages(): Promise<JourneyStageRecord[]> {
  const all = await getActiveStages();
  return all.filter((s) => s.kind !== "ACTIVE");
}

export async function getStageByKey(key: StageKey): Promise<JourneyStageRecord | null> {
  const all = await getJourneyConfig();
  return all.find((s) => s.key === key) ?? null;
}

export async function getLabelFor(key: StageKey): Promise<string> {
  const stage = await getStageByKey(key);
  return stage?.label ?? key;
}

export async function isTerminalStage(key: StageKey): Promise<boolean> {
  const stage = await getStageByKey(key);
  return stage?.kind === "WON" || stage?.kind === "LOST";
}

export async function isLostStage(key: StageKey): Promise<boolean> {
  const stage = await getStageByKey(key);
  return stage?.kind === "LOST";
}

export async function isWonStage(key: StageKey): Promise<boolean> {
  const stage = await getStageByKey(key);
  return stage?.kind === "WON";
}

/** Next ACTIVE stage after `from`, or null at the tail. */
export async function nextStage(from: StageKey): Promise<JourneyStageRecord | null> {
  const funnel = await getFunnelStages();
  const idx = funnel.findIndex((s) => s.key === from);
  if (idx === -1) return null;
  return funnel[idx + 1] ?? null;
}

/** `to` must be the immediately-next funnel stage, or any LOST-kind stage. */
export async function canAdvanceWithoutSkip(from: StageKey, to: StageKey): Promise<boolean> {
  const toStage = await getStageByKey(to);
  if (!toStage || !toStage.active) return false;
  if (toStage.kind === "LOST") return true;
  if (from === to) return false;
  const funnel = await getFunnelStages();
  const fromIdx = funnel.findIndex((s) => s.key === from);
  const toIdx = funnel.findIndex((s) => s.key === to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1;
}

/** A default WON key (first WON-kind stage) — used when a sale auto-advances. */
export async function getWonKey(): Promise<StageKey | null> {
  const terminals = await getTerminalStages();
  return terminals.find((s) => s.kind === "WON")?.key ?? null;
}

/** A default LOST key — for "ghost" advancement. */
export async function getLostKey(): Promise<StageKey | null> {
  const terminals = await getTerminalStages();
  return terminals.find((s) => s.kind === "LOST")?.key ?? null;
}

/** Map<key, stageRecord> for quick lookup in UI. */
export async function getStageMap(): Promise<Map<StageKey, JourneyStageRecord>> {
  const all = await getJourneyConfig();
  return new Map(all.map((s) => [s.key, s]));
}

/** Stagnation days for `key`, or a safe default. */
export async function getStagnationDays(key: StageKey): Promise<number> {
  const stage = await getStageByKey(key);
  return stage?.stagnationDays ?? 7;
}

/** SLA hours for `key`, or a safe default. */
export async function getSlaHours(key: StageKey): Promise<number> {
  const stage = await getStageByKey(key);
  return stage?.slaHours ?? 24;
}
