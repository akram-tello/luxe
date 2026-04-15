import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { listAssignableUsers } from "@/server/services/auth";

export async function GET(req: NextRequest) {
  try {
    const ctx = await authedContext(req);
    const users = await listAssignableUsers(ctx.actor);
    return jsonOk({ users });
  } catch (err) {
    return handleRouteError(err);
  }
}

// User creation is now invite-only. See /settings/team and
// `createInvitation` in `server/services/invitations`.
