import { z } from "zod";

export const stageKindSchema = z.enum(["ACTIVE", "WON", "LOST"]);

const stageKey = z
  .string()
  .trim()
  .min(1, "Key required")
  .max(64, "Key too long")
  .regex(/^[A-Z0-9_]+$/, "Use A–Z, 0–9, or underscores");

export const createStageSchema = z.object({
  key: stageKey,
  label: z.string().trim().min(1).max(80),
  kind: stageKindSchema,
  stagnationDays: z.coerce.number().int().min(0).max(9999),
  slaHours: z.coerce.number().int().min(0).max(9999),
  color: z.string().trim().max(16).nullable().optional(),
});

export const updateStageSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  kind: stageKindSchema,
  stagnationDays: z.coerce.number().int().min(0).max(9999),
  slaHours: z.coerce.number().int().min(0).max(9999),
  color: z.string().trim().max(16).nullable().optional(),
  active: z.coerce.boolean().optional(),
});

export const reorderStagesSchema = z.object({
  order: z.array(z.string().min(1)).min(1),
});

export const createStepSchema = z.object({
  stageId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional().nullable(),
});

export const updateStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional().nullable(),
  active: z.coerce.boolean().optional(),
});

export const reorderStepsSchema = z.object({
  stageId: z.string().min(1),
  order: z.array(z.string().min(1)).min(1),
});

export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type CreateStepInput = z.infer<typeof createStepSchema>;
export type UpdateStepInput = z.infer<typeof updateStepSchema>;
