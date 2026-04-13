import { ActivityType, AuditAction, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BusinessRuleError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { env } from "@/lib/env";
import type { SessionUser } from "@/lib/auth/session";
import type { CreateTemplateInput, RenderTemplateInput, UpdateTemplateInput } from "@/lib/validators/template";
import { ALLOWED_TEMPLATE_VARS } from "@/lib/validators/template";
import { toWhatsAppDigits } from "@/lib/utils/phone";
import { writeAudit } from "@/server/services/audit";

type Ctx = { actor: SessionUser; ip?: string; userAgent?: string };

const VAR_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

function extractVars(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(VAR_PATTERN)) {
    if (match[1]) found.add(match[1]);
  }
  return Array.from(found);
}

function assertAllowedVars(declared: string[], body: string): void {
  const used = extractVars(body);
  for (const v of used) {
    if (!ALLOWED_TEMPLATE_VARS.includes(v as (typeof ALLOWED_TEMPLATE_VARS)[number])) {
      throw new BusinessRuleError(`Unsupported template variable: {{${v}}}`);
    }
    if (!declared.includes(v)) {
      throw new BusinessRuleError(`Declared variables do not include {{${v}}}`);
    }
  }
}

export async function listTemplates() {
  return prisma.template.findMany({
    where: { deletedAt: null, active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function createTemplate(input: CreateTemplateInput, ctx: Ctx) {
  if (ctx.actor.role !== UserRole.MANAGER) throw new ForbiddenError("Only managers may create templates");
  assertAllowedVars(input.variables, input.body);
  return prisma.$transaction(async (tx) => {
    const tpl = await tx.template.create({
      data: {
        name: input.name,
        category: input.category,
        body: input.body,
        variables: input.variables as Prisma.InputJsonValue,
        active: input.active,
      },
    });
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.CREATE,
        entityType: "template",
        entityId: tpl.id,
        after: tpl,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );
    return tpl;
  });
}

export async function updateTemplate(id: string, input: UpdateTemplateInput, ctx: Ctx) {
  if (ctx.actor.role !== UserRole.MANAGER) throw new ForbiddenError("Only managers may update templates");
  const existing = await prisma.template.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError("Template not found");
  if (input.body && input.variables) assertAllowedVars(input.variables, input.body);

  const data: Prisma.TemplateUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.category !== undefined) data.category = input.category;
  if (input.body !== undefined) data.body = input.body;
  if (input.variables !== undefined) data.variables = input.variables as Prisma.InputJsonValue;
  if (input.active !== undefined) data.active = input.active;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.template.update({ where: { id }, data });
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.UPDATE,
        entityType: "template",
        entityId: id,
        before: existing,
        after: updated,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );
    return updated;
  });
}

export async function softDeleteTemplate(id: string, ctx: Ctx) {
  if (ctx.actor.role !== UserRole.MANAGER) throw new ForbiddenError("Only managers may delete templates");
  const existing = await prisma.template.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError("Template not found");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.template.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.DELETE,
        entityType: "template",
        entityId: id,
        before: existing,
        after: updated,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );
    return updated;
  });
}

export type RenderedTemplate = {
  templateId: string;
  clientId: string;
  text: string;
  whatsAppUrl: string;
  variables: Record<string, string>;
};

export async function renderAndLog(input: RenderTemplateInput, ctx: Ctx): Promise<RenderedTemplate> {
  const [tpl, client] = await Promise.all([
    prisma.template.findFirst({ where: { id: input.templateId, deletedAt: null, active: true } }),
    prisma.client.findFirst({
      where: { id: input.clientId, deletedAt: null },
      include: { owner: { select: { id: true, name: true } } },
    }),
  ]);
  if (!tpl) throw new NotFoundError("Template not found");
  if (!client) throw new NotFoundError("Client not found");
  if (ctx.actor.role === UserRole.ASSOCIATE && client.ownerId !== ctx.actor.id) {
    throw new ForbiddenError("You do not have access to this client");
  }

  const wishlistItem = input.overrides?.wishlist_item ?? firstWishlistLabel(client.wishlist);

  const variables: Record<string, string> = {
    client_name: client.name,
    associate_name: client.owner?.name ?? ctx.actor.name,
    store_name: env().STORE_NAME,
    wishlist_item: wishlistItem ?? "your selection",
  };

  const text = tpl.body.replace(VAR_PATTERN, (_, key: string) => variables[key] ?? `{{${key}}}`);
  const digits = toWhatsAppDigits(client.phone);
  const whatsAppUrl = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;

  await prisma.$transaction(async (tx) => {
    await tx.activity.create({
      data: {
        type: ActivityType.MESSAGE,
        clientId: client.id,
        actorId: ctx.actor.id,
        summary: `Prepared message — ${tpl.name}`,
        body: text,
        metadata: { templateId: tpl.id, whatsAppUrl, variables },
      },
    });
    await tx.client.update({
      where: { id: client.id },
      data: { lastContactAt: new Date() },
    });
    await writeAudit(
      {
        actorId: ctx.actor.id,
        action: AuditAction.CREATE,
        entityType: "message",
        entityId: tpl.id,
        metadata: { clientId: client.id, templateId: tpl.id },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      tx,
    );
  });

  return { templateId: tpl.id, clientId: client.id, text, whatsAppUrl, variables };
}

function firstWishlistLabel(wishlist: unknown): string | undefined {
  if (!Array.isArray(wishlist) || wishlist.length === 0) return undefined;
  const first = wishlist[0] as Record<string, unknown> | undefined;
  if (!first) return undefined;
  const ref = typeof first.reference === "string" ? first.reference : undefined;
  return ref;
}
