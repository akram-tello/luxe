import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { assertCronAuthorized } from "@/lib/http/cron";
import { runAnniversaryJob } from "@/server/jobs";

export async function POST(req: NextRequest) {
  try {
    assertCronAuthorized(req);
    const result = await runAnniversaryJob();
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
