import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { assertCronAuthorized } from "@/lib/http/cron";
import { runSlaBreachJob } from "@/server/jobs";

export async function POST(req: NextRequest) {
  try {
    assertCronAuthorized(req);
    const result = await runSlaBreachJob();
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
