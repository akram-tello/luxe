import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await readSession();
  if (user) redirect(user.role === "MANAGER" ? "/manager" : "/associate");

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <p className="label">Luxe Geneva</p>
        <h1 className="font-serif text-4xl mt-3">Clienteling CRM</h1>
        <div className="hairline mt-6" />
      </div>
      <div className="panel p-10">
        <LoginForm />
      </div>
      <p className="text-center text-[11px] uppercase tracking-widest text-bone/40 mt-8">
        Authorised personnel only · All activity is audited
      </p>
    </div>
  );
}
