import type { NextRequest } from "next/server";
import { handleRouteError, jsonCreated, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { createSaleSchema } from "@/lib/validators/sale";
import { listSalesForClient, recordSale } from "@/server/services/sales";
import { assertClientAccess } from "@/server/repositories/clients";
import { NotFoundError } from "@/lib/errors";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await authedContext(req);
    const client = await assertClientAccess(params.id, ctx.actor);
    if (!client) throw new NotFoundError("Client not found");
    const sales = await listSalesForClient(params.id);
    return jsonOk({ sales });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await authedContext(req);
    const body = await req.json();
    const input = createSaleSchema.parse({ ...body, clientId: params.id });
    const sale = await recordSale(input, ctx);
    return jsonCreated({ sale });
  } catch (err) {
    return handleRouteError(err);
  }
}
