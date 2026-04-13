import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { forActor } from "@/modules/reports/api";

export async function GET(req: NextRequest) {
  try {
    const ctx = await authedContext(req);
    const data = await forActor(ctx.actor);
    return jsonOk(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
