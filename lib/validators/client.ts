import { z } from "zod";
import { ClientTier } from "@prisma/client";

const stageSchema = z.string().trim().min(1).max(64);

const phoneRegex = /^\+?[0-9\s\-().]{6,20}$/;

const wishlistItem = z.object({
  reference: z.string().trim().min(1).max(200),
  note: z.string().trim().max(500).optional(),
  addedAt: z.string().datetime().optional(),
});

const collectionItem = z.object({
  reference: z.string().trim().min(1).max(200),
  purchasedAt: z.string().datetime().optional(),
  note: z.string().trim().max(500).optional(),
});

export const createClientSchema = z.object({
  name: z.string().trim().min(2).max(200),
  phone: z.string().trim().regex(phoneRegex, "Invalid phone number"),
  email: z.string().trim().email().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  tier: z.nativeEnum(ClientTier).default(ClientTier.STANDARD),
  ownerId: z.string().min(1, "Owner is required"),
  birthday: z.string().date().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  anniversary: z.string().date().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  notes: z.string().trim().max(5000).optional(),
  wishlist: z.array(wishlistItem).max(50).optional(),
  collection: z.array(collectionItem).max(100).optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  stage: stageSchema.optional(),
});

export const reassignClientSchema = z.object({
  ownerId: z.string().min(1),
  reason: z.string().trim().min(3).max(500),
});

export const clientFilterSchema = z.object({
  stage: stageSchema.optional(),
  tier: z.nativeEnum(ClientTier).optional(),
  ownerId: z.string().min(1).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ReassignClientInput = z.infer<typeof reassignClientSchema>;
