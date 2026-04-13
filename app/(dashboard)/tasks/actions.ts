"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/guard";
import { updateTask, softDeleteTask } from "@/server/services/tasks";
import { clientIp } from "@/lib/utils/rateLimit";

async function ctx() {
  const h = headers();
  const actor = await requireUser();
  return { actor, ip: clientIp(h), userAgent: h.get("user-agent") ?? undefined };
}

export async function completeTaskAction(id: string) {
  const c = await ctx();
  await updateTask(id, { status: "COMPLETED" }, c);
  revalidatePath("/tasks");
  revalidatePath("/associate");
  revalidatePath("/manager");
}

export async function cancelTaskAction(id: string) {
  const c = await ctx();
  await softDeleteTask(id, c);
  revalidatePath("/tasks");
}
