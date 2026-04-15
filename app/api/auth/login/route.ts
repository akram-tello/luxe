import type { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validators/auth";
import { loginStep1 } from "@/server/services/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";
import { RateLimitError } from "@/lib/errors";

// Step 1 only. The client must follow up with POST /api/auth/2fa
// (enroll or verify) to complete sign-in. A full session is never
// issued by this endpoint.
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
    const rl = rateLimit(`login:${ip}`, 10, 60_000);
    if (!rl.allowed) throw new RateLimitError();
    const body = await req.json();
    const input = loginSchema.parse(body);
    const { stage } = await loginStep1(input, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    return jsonOk({ stage });
  } catch (err) {
    return handleRouteError(err);
  }
}
