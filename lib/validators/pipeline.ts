import { z } from "zod";
import { PipelineStage } from "@prisma/client";

export const advanceStageSchema = z.object({
  stage: z.nativeEnum(PipelineStage),
  note: z.string().trim().min(5, "A note is required").max(2000),
  force: z.boolean().optional(),
});

export type AdvanceStageInput = z.infer<typeof advanceStageSchema>;
