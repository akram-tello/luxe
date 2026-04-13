import { z } from "zod";

const TEMPLATE_VARS = [
  "client_name",
  "associate_name",
  "store_name",
  "wishlist_item",
] as const;

export const templateVariableSchema = z.enum(TEMPLATE_VARS);
export const ALLOWED_TEMPLATE_VARS = TEMPLATE_VARS;

export const createTemplateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2).max(80),
  body: z.string().trim().min(5).max(5000),
  variables: z.array(templateVariableSchema).min(0).max(10),
  active: z.boolean().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const renderTemplateSchema = z.object({
  templateId: z.string().min(1),
  clientId: z.string().min(1),
  overrides: z
    .object({
      wishlist_item: z.string().trim().max(200).optional(),
    })
    .optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type RenderTemplateInput = z.infer<typeof renderTemplateSchema>;
