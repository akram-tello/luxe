import type { NextRequest } from "next/server";
import { handleRouteError, jsonCreated, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { paginationQuery } from "@/lib/validators/common";
import { clientFilterSchema, createClientSchema } from "@/lib/validators/client";
import * as clientsApi from "@/modules/clients/api";

export async function GET(req: NextRequest) {
  try {
    const ctx = await authedContext(req);
    const url = new URL(req.url);
    const pagination = paginationQuery.parse(Object.fromEntries(url.searchParams));
    const filters = clientFilterSchema.parse({
      stage: url.searchParams.get("stage") ?? undefined,
      tier: url.searchParams.get("tier") ?? undefined,
      ownerId: url.searchParams.get("ownerId") ?? undefined,
    });
    const result = await clientsApi.list(ctx.actor, pagination, filters);
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await authedContext(req);
    const body = await req.json();
    const input = createClientSchema.parse(body);
    const client = await clientsApi.create(input, ctx);
    return jsonCreated({ client });
  } catch (err) {
    return handleRouteError(err);
  }
}
