import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { assertCronAuthorized } from "@/lib/http/cron";
import { runDormantClientJob } from "@/server/jobs";

export async function POST(req: NextRequest) {
  try {
    assertCronAuthorized(req);
    const result = await runDormantClientJob();
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
