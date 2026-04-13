import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await readSession();
  if (user) redirect(user.role === "MANAGER" ? "/manager" : "/associate");

  return (
    <div className="w-full max-w-[420px]">
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-3 font-display text-[40px] leading-[1.05] tracking-tight-3 font-light">
        Sign in to the <span className="italic">boutique</span>
      </h1>
      <p className="mt-3 text-[14px] text-ink-3 max-w-sm">
        Use the credentials provided by your boutique manager.
      </p>
      <div className="mt-10">
        <LoginForm />
      </div>
      <p className="mt-12 text-[11px] uppercase tracking-wide-3 text-ink-4">
        Luxe CRM · v1 · Geneva
      </p>
    </div>
  );
}
