import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { advanceStageSchema } from "@/lib/validators/pipeline";
import * as pipelineApi from "@/modules/pipeline/api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await authedContext(req);
    const body = await req.json();
    const input = advanceStageSchema.parse(body);
    const client = await pipelineApi.advance(params.id, input, ctx);
    return jsonOk({ client });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await authedContext(req);
    const history = await pipelineApi.history(params.id);
    return jsonOk({ history });
  } catch (err) {
    return handleRouteError(err);
  }
}
