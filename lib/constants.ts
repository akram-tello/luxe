/**
 * Pipeline primitives are now dynamic — managers edit stages at /settings/journey.
 * This module re-exports the async helpers in lib/journey/config.ts under
 * familiar names, and keeps a small set of compile-time fallback constants
 * so non-critical code paths never explode if the DB is unseeded.
 */

export type {
  StageKey,
  StageKind,
  JourneyStageRecord,
  JourneyStepRecord,
} from "./journey/config";

export {
  getJourneyConfig,
  getActiveStages,
  getFunnelStages,
  getTerminalStages,
  getStageByKey,
  getStageMap,
  getLabelFor,
  getStagnationDays,
  getSlaHours,
  getWonKey,
  getLostKey,
  isTerminalStage,
  isLostStage,
  isWonStage,
  nextStage,
  canAdvanceWithoutSkip,
} from "./journey/config";

/**
 * Fallback list used when a UI needs a synchronous default (e.g. a Zod
 * enum for a client-side select). Keep these matching the seeded keys.
 */
export const DEFAULT_STAGE_KEYS = [
  "PROSPECT",
  "CONTACTED",
  "ENGAGED",
  "APPOINTMENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const DORMANT_DAYS = 30;
export const SERVICE_YEARS = 5;

/** Fallback first-contact SLA when a stage record is missing. */
export const SLA_HOURS = 24;
