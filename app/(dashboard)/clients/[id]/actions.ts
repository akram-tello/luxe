"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/guard";
import { advanceStageSchema } from "@/lib/validators/pipeline";
import { createActivitySchema } from "@/lib/validators/activity";
import { createSaleSchema } from "@/lib/validators/sale";
import { renderTemplateSchema } from "@/lib/validators/template";
import { reassignClientSchema } from "@/lib/validators/client";
import { advanceStage } from "@/server/services/pipeline";
import { logActivity } from "@/server/services/activities";
import { recordSale } from "@/server/services/sales";
import { renderAndLog } from "@/server/services/templates";
import { reassignClient } from "@/server/services/clients";
import { AppError } from "@/lib/errors";
import { clientIp } from "@/lib/utils/rateLimit";

type State = { error?: string; message?: string };

async function ctx() {
  const h = headers();
  const actor = await requireUser();
  return { actor, ip: clientIp(h), userAgent: h.get("user-agent") ?? undefined };
}

export async function advanceStageAction(
  clientId: string,
  _prev: State,
  formData: FormData,
): Promise<State> {
  try {
    const c = await ctx();
    const input = advanceStageSchema.parse({
      stage: formData.get("stage"),
      note: formData.get("note"),
      force: formData.get("force") === "on",
    });
    await advanceStage(clientId, input, c);
    revalidatePath(`/clients/${clientId}`);
    return { message: "Stage updated." };
  } catch (err) {
    return handleErr(err);
  }
}

export async function logActivityAction(
  clientId: string,
  _prev: State,
  formData: FormData,
): Promise<State> {
  try {
    const c = await ctx();
    const input = createActivitySchema.parse({
      clientId,
      type: formData.get("type"),
      summary: formData.get("summary"),
      body: formData.get("body") || undefined,
    });
    await logActivity(input, c);
    revalidatePath(`/clients/${clientId}`);
    return { message: "Activity logged." };
  } catch (err) {
    return handleErr(err);
  }
}

export async function recordSaleAction(
  clientId: string,
  _prev: State,
  formData: FormData,
): Promise<State> {
  try {
    const c = await ctx();
    const purchaseRaw = String(formData.get("purchaseDate") ?? "");
    const isoPurchase = purchaseRaw ? new Date(`${purchaseRaw}T00:00:00Z`).toISOString() : "";
    const input = createSaleSchema.parse({
      clientId,
      product: formData.get("product"),
      reference: formData.get("reference") || undefined,
      amount: formData.get("amount"),
      currency: formData.get("currency") || "USD",
      purchaseDate: isoPurchase,
    });
    await recordSale(input, c);
    revalidatePath(`/clients/${clientId}`);
    return { message: "Sale recorded." };
  } catch (err) {
    return handleErr(err);
  }
}

export type RenderMessageState = {
  error?: string;
  text?: string;
  whatsAppUrl?: string;
};

export async function renderMessageAction(
  clientId: string,
  _prev: RenderMessageState,
  formData: FormData,
): Promise<RenderMessageState> {
  try {
    const c = await ctx();
    const input = renderTemplateSchema.parse({
      clientId,
      templateId: formData.get("templateId"),
      overrides: {
        wishlist_item: (formData.get("wishlist_item") as string) || undefined,
      },
    });
    const result = await renderAndLog(input, c);
    revalidatePath(`/clients/${clientId}`);
    return { text: result.text, whatsAppUrl: result.whatsAppUrl };
  } catch (err) {
    const s = handleErr(err);
    return { error: s.error };
  }
}

export async function reassignAction(
  clientId: string,
  _prev: State,
  formData: FormData,
): Promise<State> {
  try {
    const c = await ctx();
    const input = reassignClientSchema.parse({
      ownerId: formData.get("ownerId"),
      reason: formData.get("reason"),
    });
    await reassignClient(clientId, input, c);
    revalidatePath(`/clients/${clientId}`);
    return { message: "Client reassigned." };
  } catch (err) {
    return handleErr(err);
  }
}

function handleErr(err: unknown): State {
  if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Invalid input" };
  if (err instanceof AppError) return { error: err.message };
  console.error(err);
  return { error: "Operation failed" };
}
