"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { loginSchema } from "@/lib/validators/auth";
import { login } from "@/server/services/auth";
import { AppError } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";

type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  let redirectPath: string | null = null;
  try {
    const h = headers();
    const ip = clientIp(h);
    const rl = rateLimit(`login:${ip}`, 10, 60_000);
    if (!rl.allowed) return { error: "Too many attempts. Please wait a moment." };

    const input = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    const user = await login(input, { ip, userAgent: h.get("user-agent") ?? undefined });
    redirectPath = user.role === "MANAGER" ? "/manager" : "/associate";
  } catch (err) {
    if (err instanceof ZodError) return { error: "Please provide a valid email and password." };
    if (err instanceof AppError) return { error: err.message };
    console.error(err);
    return { error: "Sign-in failed. Please try again." };
  }
  if (redirectPath) redirect(redirectPath);
  return {};
}
