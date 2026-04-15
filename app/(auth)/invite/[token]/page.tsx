import Link from "next/link";
import { findInvitationByToken } from "@/server/services/invitations";
import { AcceptForm } from "./AcceptForm";

export default async function AcceptInvitePage({
  params,
}: {
  params: { token: string };
}) {
  const inv = await findInvitationByToken(params.token);

  if (!inv) {
    return (
      <div className="w-full max-w-[420px]">
        <p className="eyebrow text-danger">Invitation unavailable</p>
        <h1 className="mt-3 font-display text-[32px] leading-[1.08] tracking-tight-2 font-light">
          This link is no longer valid.
        </h1>
        <p className="mt-3 text-[14px] text-ink-3">
          It may have expired, been revoked, or already been used. Ask your
          manager to issue a new invitation.
        </p>
        <Link href="/login" className="btn-ghost mt-8 inline-flex">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px]">
      <p className="eyebrow">Invitation</p>
      <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight-3 font-light">
        Welcome to <span className="italic">SWG Boutique</span>
      </h1>
      <p className="mt-3 text-[14px] text-ink-3 max-w-sm">
        You were invited as{" "}
        <span className="text-ink numeric">{inv.email}</span>. Set your name and
        password — you&apos;ll enable two-factor authentication next.
      </p>
      <div className="mt-10">
        <AcceptForm token={params.token} />
      </div>
    </div>
  );
}
