import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { updateClientSchema } from "@/lib/validators/client";
import * as clientsApi from "@/modules/clients/api";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await authedContext(req);
    const data = await clientsApi.detail(params.id, ctx.actor);
    return jsonOk(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await authedContext(req);
    const body = await req.json();
    const input = updateClientSchema.parse(body);
    const client = await clientsApi.update(params.id, input, ctx);
    return jsonOk({ client });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await authedContext(req);
    const client = await clientsApi.archive(params.id, ctx);
    return jsonOk({ client });
  } catch (err) {
    return handleRouteError(err);
  }
}
