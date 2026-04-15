import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { readPreAuth } from "@/lib/auth/session";
import { otpauthQrDataUrl } from "@/lib/auth/totp";
import { EnrollForm } from "./EnrollForm";

export default async function EnrollPage() {
  const pre = await readPreAuth();
  if (!pre) redirect("/login");
  if (pre.stage !== "enroll") redirect("/2fa/verify");

  const user = await prisma.user.findUnique({
    where: { id: pre.userId },
    select: { totpSecret: true, email: true },
  });
  if (!user?.totpSecret) redirect("/login");

  const qr = await otpauthQrDataUrl(user.totpSecret, user.email);

  return (
    <div className="w-full max-w-[420px]">
      <p className="eyebrow">Two-factor required</p>
      <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight-3 font-light">
        Protect your <span className="italic">account</span>
      </h1>
      <p className="mt-3 text-[14px] text-ink-3 max-w-sm">
        Scan the code with Google Authenticator, Authy, or 1Password. Enter the
        six-digit code shown in the app to finish setup.
      </p>

      <div className="mt-8 flex flex-col items-center gap-5 p-6 surface-flat">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt="Two-factor QR code"
          width={200}
          height={200}
          className="rounded-lg bg-chalk p-2 ring-1 ring-gold/30"
        />
        <div className="w-full text-center">
          <p className="eyebrow">Manual entry</p>
          <code className="numeric mt-2 inline-block text-[12px] text-ink-2 break-all">
            {user.totpSecret.match(/.{1,4}/g)?.join(" ")}
          </code>
        </div>
      </div>

      <div className="mt-8">
        <EnrollForm />
      </div>
    </div>
  );
}
