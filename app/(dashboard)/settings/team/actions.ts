"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireManager } from "@/lib/auth/guard";
import { createInvitation, revokeInvitation } from "@/server/services/invitations";
import { AppError } from "@/lib/errors";
import { clientIp } from "@/lib/utils/rateLimit";

type State = { error?: string; message?: string; inviteUrl?: string };

function baseUrlFromHeaders(h: Headers): string {
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function inviteAssociateAction(_prev: State, formData: FormData): Promise<State> {
  try {
    const h = headers();
    const actor = await requireManager();
    const email = String(formData.get("email") ?? "");
    const name = String(formData.get("name") ?? "");
    const created = await createInvitation(
      { email, name },
      actor,
      { ip: clientIp(h), userAgent: h.get("user-agent") ?? undefined },
      baseUrlFromHeaders(h),
    );
    revalidatePath("/settings/team");
    return {
      message: `Invitation ready for ${created.email}. Share the link below — it expires ${created.expiresAt.toLocaleDateString()}.`,
      inviteUrl: created.url,
    };
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    console.error(err);
    return { error: "Could not create invitation." };
  }
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const h = headers();
  const actor = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await revokeInvitation(id, actor, {
      ip: clientIp(h),
      userAgent: h.get("user-agent") ?? undefined,
    });
  } catch (err) {
    console.error(err);
  }
  revalidatePath("/settings/team");
}
