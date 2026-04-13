import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { assertCronAuthorized } from "@/lib/http/cron";
import {
  runAnniversaryJob,
  runDormantClientJob,
  runServiceReminderJob,
  runSlaBreachJob,
  runStagnationJob,
} from "@/server/jobs";

export async function POST(req: NextRequest) {
  try {
    assertCronAuthorized(req);
    const results = await Promise.all([
      runSlaBreachJob(),
      runStagnationJob(),
      runAnniversaryJob(),
      runServiceReminderJob(),
      runDormantClientJob(),
    ]);
    return jsonOk({ results });
  } catch (err) {
    return handleRouteError(err);
  }
}
