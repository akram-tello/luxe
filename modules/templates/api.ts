import type { SessionUser } from "@/lib/auth/session";
import type { CreateTemplateInput, RenderTemplateInput, UpdateTemplateInput } from "@/lib/validators/template";
import {
  createTemplate,
  listTemplates,
  renderAndLog,
  softDeleteTemplate,
  updateTemplate,
} from "@/server/services/templates";

type Ctx = { actor: SessionUser; ip?: string; userAgent?: string };

export function list() {
  return listTemplates();
}

export function create(input: CreateTemplateInput, ctx: Ctx) {
  return createTemplate(input, ctx);
}

export function update(id: string, input: UpdateTemplateInput, ctx: Ctx) {
  return updateTemplate(id, input, ctx);
}

export function archive(id: string, ctx: Ctx) {
  return softDeleteTemplate(id, ctx);
}

export function render(input: RenderTemplateInput, ctx: Ctx) {
  return renderAndLog(input, ctx);
}
