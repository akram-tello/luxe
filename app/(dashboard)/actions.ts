"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { readSession } from "@/lib/auth/session";
import { logout } from "@/server/services/auth";
import { clientIp } from "@/lib/utils/rateLimit";

export async function logoutAction() {
  const h = headers();
  const actor = await readSession();
  await logout(actor, { ip: clientIp(h), userAgent: h.get("user-agent") ?? undefined });
  redirect("/login");
}
