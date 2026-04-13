import type { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validators/auth";
import { login } from "@/server/services/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";
import { RateLimitError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
    const rl = rateLimit(`login:${ip}`, 10, 60_000);
    if (!rl.allowed) throw new RateLimitError();
    const body = await req.json();
    const input = loginSchema.parse(body);
    const session = await login(input, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
    return jsonOk({ user: session });
  } catch (err) {
    return handleRouteError(err);
  }
}
