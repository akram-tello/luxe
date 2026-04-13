import { PipelineStage } from "@prisma/client";

export const PIPELINE_ORDER: PipelineStage[] = [
  "PROSPECT",
  "CONTACTED",
  "ENGAGED",
  "APPOINTMENT",
  "NEGOTIATION",
  "WON",
];

export const PIPELINE_TERMINAL: PipelineStage[] = ["WON", "LOST"];

export const PIPELINE_LABEL: Record<PipelineStage, string> = {
  PROSPECT: "Prospect",
  CONTACTED: "Contacted",
  ENGAGED: "Engaged",
  APPOINTMENT: "Appointment",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export function nextStage(stage: PipelineStage): PipelineStage | null {
  const idx = PIPELINE_ORDER.indexOf(stage);
  if (idx === -1) return null;
  if (idx >= PIPELINE_ORDER.length - 1) return null;
  return PIPELINE_ORDER[idx + 1] ?? null;
}

export function canAdvanceWithoutSkip(from: PipelineStage, to: PipelineStage): boolean {
  if (to === "LOST") return true;
  if (from === to) return false;
  const fromIdx = PIPELINE_ORDER.indexOf(from);
  const toIdx = PIPELINE_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1;
}

export const STAGNATION_DAYS: Record<PipelineStage, number> = {
  PROSPECT: 3,
  CONTACTED: 5,
  ENGAGED: 7,
  APPOINTMENT: 3,
  NEGOTIATION: 5,
  WON: 9999,
  LOST: 9999,
};

export const DORMANT_DAYS = 30;
export const SLA_HOURS = 24;
export const SERVICE_YEARS = 5;
