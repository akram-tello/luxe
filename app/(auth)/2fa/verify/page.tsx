import { redirect } from "next/navigation";
import { readPreAuth } from "@/lib/auth/session";
import { VerifyForm } from "./VerifyForm";

export default async function VerifyPage() {
  const pre = await readPreAuth();
  if (!pre) redirect("/login");
  if (pre.stage === "enroll") redirect("/2fa/enroll");

  return (
    <div className="w-full max-w-[420px]">
      <p className="eyebrow">Two-factor</p>
      <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight-3 font-light">
        Enter your <span className="italic">code</span>
      </h1>
      <p className="mt-3 text-[14px] text-ink-3 max-w-sm">
        Open your authenticator app and enter the six-digit code for
        <span className="text-ink"> {pre.email}</span>.
      </p>
      <div className="mt-10">
        <VerifyForm />
      </div>
    </div>
  );
}
