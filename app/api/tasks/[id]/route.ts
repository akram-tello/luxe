import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { updateTaskSchema } from "@/lib/validators/task";
import * as tasksApi from "@/modules/tasks/api";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await authedContext(req);
    const task = await tasksApi.detail(params.id, ctx.actor);
    return jsonOk({ task });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await authedContext(req);
    const body = await req.json();
    const input = updateTaskSchema.parse(body);
    const task = await tasksApi.update(params.id, input, ctx);
    return jsonOk({ task });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await authedContext(req);
    const task = await tasksApi.cancel(params.id, ctx);
    return jsonOk({ task });
  } catch (err) {
    return handleRouteError(err);
  }
}
