"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/guard";
import { createClientSchema } from "@/lib/validators/client";
import { createClient } from "@/server/services/clients";
import { AppError } from "@/lib/errors";
import { clientIp } from "@/lib/utils/rateLimit";

type State = { error?: string };

export async function createClientAction(_prev: State, formData: FormData): Promise<State> {
  let newId: string | null = null;
  try {
    const actor = await requireUser();
    const h = headers();
    const input = createClientSchema.parse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || "",
      tier: formData.get("tier") || undefined,
      ownerId: formData.get("ownerId"),
      birthday: formData.get("birthday") || "",
      anniversary: formData.get("anniversary") || "",
      notes: formData.get("notes") || undefined,
    });
    const created = await createClient(input, {
      actor,
      ip: clientIp(h),
      userAgent: h.get("user-agent") ?? undefined,
    });
    newId = created.id;
  } catch (err) {
    if (err instanceof ZodError) {
      return { error: err.issues[0]?.message ?? "Invalid form data" };
    }
    if (err instanceof AppError) return { error: err.message };
    console.error(err);
    return { error: "Could not create client" };
  }
  if (newId) redirect(`/clients/${newId}`);
  return {};
}
