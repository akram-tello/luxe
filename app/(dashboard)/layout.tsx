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
    <div className="min-h-screen grid grid-cols-[248px_1fr]">
      <aside className="sticky top-0 h-screen border-r border-hair bg-chalk/60 backdrop-blur-xl flex flex-col">
        <div className="px-7 pt-8 pb-6">
          <Link href={user.role === "MANAGER" ? "/manager" : "/associate"} className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-full border border-hair-2 bg-paper flex items-center justify-center transition-colors group-hover:border-ink/30">
              <span className="font-display text-[18px] leading-none">L</span>
            </div>
            <div className="leading-tight">
              <p className="font-display text-[17px] tracking-tight-2">Luxe</p>
              <p className="text-[10px] uppercase tracking-wide-3 text-ink-3">Geneva Boutique</p>
            </div>
          </Link>
        </div>

        <Nav role={user.role} overdueCount={overdueCount} />

        <div className="mt-auto p-4">
          <div className="surface-flat p-4 flex items-center gap-3">
            <div className="initial-badge h-10 w-10 text-[14px]">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate">{user.name}</p>
              <p className="text-[10px] uppercase tracking-wide-3 text-ink-3">
                {user.role === "MANAGER" ? "Manager" : "Associate"}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-hair bg-paper/80 backdrop-blur-xl">
          <div className="h-[72px] px-10 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <p className="eyebrow">Today</p>
              <div className="h-4 w-px bg-hair-2" />
              <p className="text-[14px] text-ink-2">
                Welcome back, <span className="text-ink font-medium">{user.name.split(" ")[0]}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {overdueCount > 0 ? (
                <Link href="/tasks?overdue=true" className="chip-danger">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  {overdueCount} overdue
                </Link>
              ) : (
                <span className="chip-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  On schedule
                </span>
              )}
              <Link href="/clients/new" className="btn-primary btn-sm">
                New client
              </Link>
            </div>
          </div>
        </header>
        <div className="px-10 py-10">{children}</div>
      </main>
    </div>
  );
}
