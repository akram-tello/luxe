import { z } from "zod";

export const advanceStageSchema = z.object({
  stage: z.string().trim().min(1, "Stage is required").max(64),
  note: z.string().trim().min(5, "A note is required").max(2000),
  force: z.boolean().optional(),
});

export type AdvanceStageInput = z.infer<typeof advanceStageSchema>;
