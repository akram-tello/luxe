import crypto from "node:crypto";
import { AuditAction, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { generateSecret } from "@/lib/auth/totp";
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { writeAudit } from "@/server/services/audit";
import { assertManagerWith2FA } from "@/server/services/auth";
import type { SessionUser } from "@/lib/auth/session";

type Ctx = { ip?: string; userAgent?: string };

const ALLOWED_DOMAIN = "@valiram.com";
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function assertValiramEmail(email: string): void {
  if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    throw new ValidationError(`Email must end with ${ALLOWED_DOMAIN}`);
  }
}

function makeToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type CreatedInvitation = {
  id: string;
  email: string;
  url: string;
  expiresAt: Date;
};

export async function createInvitation(
  input: { email: string; name: string },
  actor: SessionUser,
  ctx: Ctx,
  baseUrl: string,
): Promise<CreatedInvitation> {
  await assertManagerWith2FA(actor);
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (name.length < 2) throw new ValidationError("Name is required");
  assertValiramEmail(email);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new BusinessRuleError("A user with this email already exists");

  const pending = await prisma.invitation.findFirst({
    where: { email, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  if (pending) {
    throw new BusinessRuleError(
      "An active invitation already exists for this email. Revoke it to issue a new one.",
    );
  }

  const { token, hash } = makeToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const inv = await prisma.invitation.create({
    data: {
      email,
      tokenHash: hash,
      role: UserRole.ASSOCIATE,
      invitedById: actor.id,
      expiresAt,
    },
  });

  await writeAudit({
    actorId: actor.id,
    action: AuditAction.CREATE,
    entityType: "invitation",
    entityId: inv.id,
    after: { email, role: UserRole.ASSOCIATE },
    metadata: { invitedName: name },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const url = `${baseUrl.replace(/\/$/, "")}/invite/${token}`;
  // Simplest possible "delivery" per product spec: console.log the link.
  // The manager also sees the URL in the UI immediately after creation.
  console.log(`[invitation] ${email} → ${url}`);

  return { id: inv.id, email, url, expiresAt };
}

export async function listInvitations(actor: SessionUser) {
  if (actor.role !== UserRole.MANAGER) throw new ForbiddenError();
  return prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    take: 100,
  });
}

export async function revokeInvitation(id: string, actor: SessionUser, ctx: Ctx) {
  if (actor.role !== UserRole.MANAGER) throw new ForbiddenError();
  const inv = await prisma.invitation.findUnique({ where: { id } });
  if (!inv) throw new NotFoundError("Invitation not found");
  if (inv.acceptedAt) throw new BusinessRuleError("Invitation already accepted");
  if (inv.revokedAt) return inv;
  const updated = await prisma.invitation.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  await writeAudit({
    actorId: actor.id,
    action: AuditAction.DELETE,
    entityType: "invitation",
    entityId: id,
    before: inv,
    after: updated,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return updated;
}

export type InvitationLookup = {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
};

// Used by the public /invite/[token] page to validate the token without
// exposing adjacent invitations. Returns null on any failure so callers
// can render a single "link invalid/expired" state.
export async function findInvitationByToken(token: string): Promise<InvitationLookup | null> {
  if (!token || typeof token !== "string") return null;
  const inv = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!inv) return null;
  if (inv.acceptedAt || inv.revokedAt) return null;
  if (inv.expiresAt.getTime() < Date.now()) return null;
  return {
    id: inv.id,
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt,
  };
}

export async function acceptInvitation(input: {
  token: string;
  name: string;
  password: string;
}): Promise<{ userId: string }> {
  const inv = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(input.token) },
  });
  if (!inv || inv.acceptedAt || inv.revokedAt || inv.expiresAt.getTime() < Date.now()) {
    throw new BusinessRuleError("This invitation is no longer valid.");
  }
  if (input.password.length < 10) {
    throw new ValidationError("Password must be at least 10 characters");
  }
  if (input.name.trim().length < 2) throw new ValidationError("Name is required");

  // Double-check nobody else took this email between invite creation and now.
  const collision = await prisma.user.findUnique({ where: { email: inv.email } });
  if (collision) throw new BusinessRuleError("A user with this email already exists");

  const passwordHash = await hashPassword(input.password);

  // We pre-seed totpSecret so /2fa/enroll has something to show on the very
  // first login, matching the flow for manually-seeded managers.
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: inv.email,
        name: input.name.trim(),
        role: inv.role,
        passwordHash,
        totpSecret: generateSecret(),
      },
    });
    await tx.invitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    });
    return u;
  });

  await writeAudit({
    actorId: user.id,
    action: AuditAction.CREATE,
    entityType: "user",
    entityId: user.id,
    after: { id: user.id, email: user.email, role: user.role, viaInvitation: inv.id },
  });

  return { userId: user.id };
}
