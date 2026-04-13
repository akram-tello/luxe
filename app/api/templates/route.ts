import type { NextRequest } from "next/server";
import { handleRouteError, jsonCreated, jsonOk } from "@/lib/http";
import { authedContext, managerContext } from "@/lib/http/route";
import { createTemplateSchema } from "@/lib/validators/template";
import * as templatesApi from "@/modules/templates/api";

export async function GET(req: NextRequest) {
  try {
    await authedContext(req);
    const templates = await templatesApi.list();
    return jsonOk({ templates });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await managerContext(req);
    const body = await req.json();
    const input = createTemplateSchema.parse(body);
    const template = await templatesApi.create(input, ctx);
    return jsonCreated({ template });
  } catch (err) {
    return handleRouteError(err);
  }
}
