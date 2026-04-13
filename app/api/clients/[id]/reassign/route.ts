import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { managerContext } from "@/lib/http/route";
import { reassignClientSchema } from "@/lib/validators/client";
import * as clientsApi from "@/modules/clients/api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await managerContext(req);
    const body = await req.json();
    const input = reassignClientSchema.parse(body);
    const client = await clientsApi.reassign(params.id, input, ctx);
    return jsonOk({ client });
  } catch (err) {
    return handleRouteError(err);
  }
}
