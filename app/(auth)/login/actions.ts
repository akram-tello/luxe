"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { loginSchema } from "@/lib/validators/auth";
import { loginStep1, confirmEnrollment, verifyLoginCode } from "@/server/services/auth";
import { AppError } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";

type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  let next: string | null = null;
  try {
    const h = headers();
    const ip = clientIp(h);
    const rl = rateLimit(`login:${ip}`, 10, 60_000);
    if (!rl.allowed) return { error: "Too many attempts. Please wait a moment." };

    const input = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    const result = await loginStep1(input, { ip, userAgent: h.get("user-agent") ?? undefined });
    next = result.stage === "enroll" ? "/2fa/enroll" : "/2fa/verify";
  } catch (err) {
    if (err instanceof ZodError) return { error: "Please provide a valid email and password." };
    if (err instanceof AppError) return { error: err.message };
    console.error(err);
    return { error: "Sign-in failed. Please try again." };
  }
  if (next) redirect(next);
  return {};
}

type CodeState = { error?: string };

export async function confirmEnrollmentAction(_prev: CodeState, formData: FormData): Promise<CodeState> {
  let next: string | null = null;
  try {
    const h = headers();
    const ip = clientIp(h);
    const rl = rateLimit(`totp:${ip}`, 10, 60_000);
    if (!rl.allowed) return { error: "Too many attempts. Please wait a moment." };
    const code = String(formData.get("code") ?? "").trim();
    const user = await confirmEnrollment(code, { ip, userAgent: h.get("user-agent") ?? undefined });
    next = user.role === "MANAGER" ? "/manager" : "/associate";
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    console.error(err);
    return { error: "Could not confirm code. Try again." };
  }
  if (next) redirect(next);
  return {};
}

export async function verifyCodeAction(_prev: CodeState, formData: FormData): Promise<CodeState> {
  let next: string | null = null;
  try {
    const h = headers();
    const ip = clientIp(h);
    const rl = rateLimit(`totp:${ip}`, 10, 60_000);
    if (!rl.allowed) return { error: "Too many attempts. Please wait a moment." };
    const code = String(formData.get("code") ?? "").trim();
    const user = await verifyLoginCode(code, { ip, userAgent: h.get("user-agent") ?? undefined });
    next = user.role === "MANAGER" ? "/manager" : "/associate";
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    console.error(err);
    return { error: "Could not verify code. Try again." };
  }
  if (next) redirect(next);
  return {};
}
