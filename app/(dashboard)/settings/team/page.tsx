import { requireManagerForPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { listInvitations } from "@/server/services/invitations";
import { PageHeader, SectionHead, Empty } from "../../_components/primitives";
import { InviteForm } from "./InviteForm";
import { revokeInvitationAction } from "./actions";

export default async function TeamPage() {
  const actor = await requireManagerForPage();
  const [me, invitations, users] = await Promise.all([
    prisma.user.findUnique({
      where: { id: actor.id },
      select: { totpEnabledAt: true },
    }),
    listInvitations(actor),
    prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, email: true, role: true, totpEnabledAt: true, active: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const canInvite = Boolean(me?.totpEnabledAt);
  const now = Date.now();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Team"
        title="Associates and invitations"
        subtitle="Invite associates with a @valiram.com address. Every user must enrol two-factor authentication on first sign-in."
      />

      {!canInvite ? (
        <div className="rounded-xl border border-warn/40 bg-warn/5 px-5 py-4">
          <p className="eyebrow text-warn">Two-factor required</p>
          <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">
            You must enable two-factor authentication on your own account
            before you can invite associates. Sign out and sign back in to
            complete the enrolment flow.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-[1fr_420px] gap-6 items-start">
        <div className="space-y-8">
          <div className="surface-flat overflow-hidden">
            <div className="px-7 pt-6">
              <SectionHead eyebrow="Active" title="Users" />
            </div>
            {users.length === 0 ? (
              <Empty>No users yet.</Empty>
            ) : (
              <ul>
                {users.map((u, i) => (
                  <li key={u.id}>
                    <div className="px-7 py-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[14px] text-ink">{u.name}</p>
                        <p className="text-[12px] text-ink-3 numeric">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={u.role === "MANAGER" ? "chip-gold" : "chip-quiet"}>
                          {u.role}
                        </span>
                        {u.totpEnabledAt ? (
                          <span className="chip-success">2FA</span>
                        ) : (
                          <span className="chip-warn">2FA pending</span>
                        )}
                        {u.active ? null : <span className="chip-danger">Inactive</span>}
                      </div>
                    </div>
                    {i < users.length - 1 ? <div className="divider" /> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface-flat overflow-hidden">
            <div className="px-7 pt-6">
              <SectionHead eyebrow="Outstanding" title="Invitations" />
            </div>
            {invitations.length === 0 ? (
              <Empty>No invitations issued.</Empty>
            ) : (
              <ul>
                {invitations.map((inv, i) => {
                  const expired = inv.expiresAt.getTime() < now;
                  const status = inv.acceptedAt
                    ? { label: "Accepted", cls: "chip-success" }
                    : inv.revokedAt
                      ? { label: "Revoked", cls: "chip-quiet" }
                      : expired
                        ? { label: "Expired", cls: "chip-danger" }
                        : { label: "Pending", cls: "chip-warn" };
                  const canRevoke = !inv.acceptedAt && !inv.revokedAt && !expired;
                  return (
                    <li key={inv.id}>
                      <div className="px-7 py-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[14px] text-ink numeric">{inv.email}</p>
                          <p className="text-[11.5px] text-ink-3 mt-1">
                            Invited by {inv.invitedBy.name} · expires{" "}
                            {inv.expiresAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={status.cls}>{status.label}</span>
                          {canRevoke ? (
                            <form action={revokeInvitationAction}>
                              <input type="hidden" name="id" value={inv.id} />
                              <button className="btn-danger btn-xs" type="submit">
                                Revoke
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                      {i < invitations.length - 1 ? <div className="divider" /> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="surface-flat p-6 sticky top-[88px]">
          <SectionHead eyebrow="Invite" title="New associate" />
          <p className="text-[12.5px] text-ink-3 mt-2 mb-4 leading-relaxed">
            The invitee receives a one-time link valid for 7 days. They set
            their password and enrol 2FA before accessing the boutique.
          </p>
          <fieldset disabled={!canInvite} className="disabled:opacity-50">
            <InviteForm />
          </fieldset>
        </div>
      </div>
    </div>
  );
}
