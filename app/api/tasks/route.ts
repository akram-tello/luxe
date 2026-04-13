import type { NextRequest } from "next/server";
import { handleRouteError, jsonCreated, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { paginationQuery } from "@/lib/validators/common";
import { createTaskSchema, taskFilterSchema } from "@/lib/validators/task";
import * as tasksApi from "@/modules/tasks/api";

export async function GET(req: NextRequest) {
  try {
    const ctx = await authedContext(req);
    const url = new URL(req.url);
    const pagination = paginationQuery.parse(Object.fromEntries(url.searchParams));
    const filters = taskFilterSchema.parse({
      status: url.searchParams.get("status") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
      priority: url.searchParams.get("priority") ?? undefined,
      assigneeId: url.searchParams.get("assigneeId") ?? undefined,
      clientId: url.searchParams.get("clientId") ?? undefined,
      overdue: url.searchParams.get("overdue") ?? undefined,
    });
    const result = await tasksApi.list(ctx.actor, pagination, {
      ...filters,
      overdue: filters.overdue === "true" ? true : undefined,
    });
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await authedContext(req);
    const body = await req.json();
    const input = createTaskSchema.parse(body);
    const task = await tasksApi.create(input, ctx);
    return jsonCreated({ task });
  } catch (err) {
    return handleRouteError(err);
  }
}
