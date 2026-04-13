import type { NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { logout } from "@/server/services/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { clientIp } from "@/lib/utils/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const actor = await readSession();
    await logout(actor, {
      ip: clientIp(req.headers),
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    return jsonOk({});
  } catch (err) {
    return handleRouteError(err);
  }
}
