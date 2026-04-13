import type { NextRequest } from "next/server";
import { handleRouteError, jsonCreated, jsonOk } from "@/lib/http";
import { authedContext, managerContext } from "@/lib/http/route";
import { createUserSchema } from "@/lib/validators/auth";
import { createUser, listAssignableUsers } from "@/server/services/auth";

export async function GET(req: NextRequest) {
  try {
    const ctx = await authedContext(req);
    const users = await listAssignableUsers(ctx.actor);
    return jsonOk({ users });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await managerContext(req);
    const body = await req.json();
    const input = createUserSchema.parse(body);
    const user = await createUser(input, ctx.actor, ctx);
    return jsonCreated({ user });
  } catch (err) {
    return handleRouteError(err);
  }
}
