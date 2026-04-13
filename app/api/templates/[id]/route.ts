import type { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { managerContext } from "@/lib/http/route";
import { updateTemplateSchema } from "@/lib/validators/template";
import * as templatesApi from "@/modules/templates/api";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await managerContext(req);
    const body = await req.json();
    const input = updateTemplateSchema.parse(body);
    const template = await templatesApi.update(params.id, input, ctx);
    return jsonOk({ template });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await managerContext(req);
    const template = await templatesApi.archive(params.id, ctx);
    return jsonOk({ template });
  } catch (err) {
    return handleRouteError(err);
  }
}
