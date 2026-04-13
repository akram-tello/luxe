"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/guard";
import { createTemplateSchema } from "@/lib/validators/template";
import { createTemplate } from "@/server/services/templates";
import { AppError } from "@/lib/errors";
import { clientIp } from "@/lib/utils/rateLimit";

type State = { error?: string; message?: string };

export async function createTemplateAction(_prev: State, formData: FormData): Promise<State> {
  try {
    const h = headers();
    const actor = await requireUser();
    const vars = String(formData.get("variables") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const input = createTemplateSchema.parse({
      name: formData.get("name"),
      category: formData.get("category"),
      body: formData.get("body"),
      variables: vars,
      active: true,
    });
    await createTemplate(input, {
      actor,
      ip: clientIp(h),
      userAgent: h.get("user-agent") ?? undefined,
    });
    revalidatePath("/templates");
    return { message: "Template created." };
  } catch (err) {
    if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Invalid template" };
    if (err instanceof AppError) return { error: err.message };
    console.error(err);
    return { error: "Could not create template" };
  }
}
