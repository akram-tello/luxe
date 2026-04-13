import { z } from "zod";

export const createSaleSchema = z.object({
  clientId: z.string().min(1),
  associateId: z.string().min(1).optional(),
  product: z.string().trim().min(2).max(300),
  reference: z.string().trim().max(128).optional(),
  amount: z.coerce.number().positive().max(10_000_000),
  currency: z.string().trim().length(3).toUpperCase().default("USD"),
  purchaseDate: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
