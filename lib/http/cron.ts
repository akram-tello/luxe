import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { UnauthorizedError } from "@/lib/errors";

export function assertCronAuthorized(req: NextRequest): void {
  const header = req.headers.get("x-cron-secret");
  const expected = env().CRON_SECRET;
  if (!header || header !== expected) {
    throw new UnauthorizedError("Invalid cron secret");
  }
}
