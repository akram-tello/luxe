import type { NextRequest } from "next/server";
import { handleRouteError, jsonCreated, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { createActivitySchema } from "@/lib/validators/activity";
import { listActivitiesForClient, logActivity } from "@/server/services/activities";
import { assertClientAccess } from "@/server/repositories/clients";
import { NotFoundError } from "@/lib/errors";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await authedContext(req);
    const client = await assertClientAccess(params.id, ctx.actor);
    if (!client) throw new NotFoundError("Client not found");
    const activities = await listActivitiesForClient(params.id, 100);
    return jsonOk({ activities });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await authedContext(req);
    const body = await req.json();
    const input = createActivitySchema.parse({ ...body, clientId: params.id });
    const activity = await logActivity(input, ctx);
    return jsonCreated({ activity });
  } catch (err) {
    return handleRouteError(err);
  }
}
