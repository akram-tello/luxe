"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { acceptInvitation } from "@/server/services/invitations";
import { loginStep1 } from "@/server/services/auth";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";

type State = { error?: string };

export async function acceptInvitationAction(_prev: State, formData: FormData): Promise<State> {
  let next: string | null = null;
  try {
    const h = headers();
    const ip = clientIp(h);
    const rl = rateLimit(`invite:${ip}`, 10, 60_000);
    if (!rl.allowed) return { error: "Too many attempts. Please wait a moment." };

    const token = String(formData.get("token") ?? "");
    const name = String(formData.get("name") ?? "");
    const password = String(formData.get("password") ?? "");
    const { userId } = await acceptInvitation({ token, name, password });

    // Auto-start step 1 so the new user lands directly on /2fa/enroll
    // without having to type credentials they just set.
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await loginStep1(
      { email: user.email, password },
      { ip, userAgent: h.get("user-agent") ?? undefined },
    );
    next = "/2fa/enroll";
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    console.error(err);
    return { error: "Could not accept invitation." };
  }
  if (next) redirect(next);
  return {};
}
