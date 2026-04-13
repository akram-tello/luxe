import { z } from "zod";
import { ActivityType } from "@prisma/client";

export const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  clientId: z.string().min(1),
  summary: z.string().trim().min(2).max(500),
  body: z.string().trim().max(10000).optional(),
  metadata: z.record(z.unknown()).optional(),
  occurredAt: z.string().datetime().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
