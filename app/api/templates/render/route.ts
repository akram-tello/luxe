import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { authedContext } from "@/lib/http/route";
import { renderTemplateSchema } from "@/lib/validators/template";
import * as templatesApi from "@/modules/templates/api";

export async function POST(req: NextRequest) {
  try {
    const ctx = await authedContext(req);
    const body = await req.json();
    const input = renderTemplateSchema.parse(body);
    const rendered = await templatesApi.render(input, ctx);
    return jsonOk(rendered);
  } catch (err) {
    return handleRouteError(err);
  }
}
