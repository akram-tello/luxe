import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { countOverdueForUser } from "@/server/repositories/tasks";
import { initials } from "@/lib/utils/format";
import { LogoutButton } from "./LogoutButton";
import { Nav } from "./Nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await readSession();
  if (!user) redirect("/login");

  const overdueCount = await countOverdueForUser(user.id);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r border-line bg-ink-soft flex flex-col">
        <div className="px-8 pt-10 pb-8 border-b border-line">
          <p className="label">Luxe Geneva</p>
          <p className="font-serif text-2xl mt-2">Clienteling</p>
        </div>
        <Nav role={user.role} overdueCount={overdueCount} />
        <div className="mt-auto p-6 border-t border-line">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gold/20 border border-gold/40 flex items-center justify-center font-serif text-gold">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm truncate">{user.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-bone/50">
                {user.role === "MANAGER" ? "Boutique Manager" : "Sales Associate"}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-h-screen">
        <header className="border-b border-line px-10 h-20 flex items-center justify-between bg-ink/80 backdrop-blur">
          <div>
            <p className="label">Dashboard</p>
            <p className="font-serif text-xl mt-0.5">Welcome, {user.name.split(" ")[0]}</p>
          </div>
          {overdueCount > 0 ? (
            <Link href="/tasks?overdue=true" className="pill-danger">
              {overdueCount} overdue
            </Link>
          ) : (
            <span className="pill-success">On schedule</span>
          )}
        </header>
        <div className="p-10">{children}</div>
      </main>
    </div>
  );
}
