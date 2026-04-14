import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { countOverdueForUser } from "@/server/repositories/tasks";
import { Nav } from "./Nav";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await readSession();
  if (!user) redirect("/login");

  const overdueCount = await countOverdueForUser(user.id);

  return (
    <div className="min-h-screen grid grid-cols-[64px_1fr]">
      <aside className="sticky top-0 h-screen border-r border-hair bg-chalk/60 backdrop-blur-xl flex flex-col items-center">
        <Link
          href={user.role === "MANAGER" ? "/manager" : "/associate"}
          className="mt-4 mb-3 h-10 w-10 rounded-xl border border-hair-2 bg-paper flex items-center justify-center hover:border-ink/30"
          title="Luxe · Geneva"
        >
          <span className="font-display text-[17px] leading-none">L</span>
        </Link>
        <div className="h-px w-8 bg-hair" />

        <Nav role={user.role} overdueCount={overdueCount} />

        <div className="mb-4 flex flex-col items-center gap-1">
          <ThemeToggle compact />
        </div>
      </aside>

      <main className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-hair bg-paper/80 backdrop-blur-xl">
          <div className="h-[64px] px-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <p className="eyebrow">Geneva Boutique</p>
              <span className="h-3.5 w-px bg-hair-2" />
              <p className="text-[13px] text-ink-2">
                Welcome, <span className="text-ink font-medium">{user.name.split(" ")[0]}</span>
              </p>
            </div>
            <div className="flex items-center gap-2.5">
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
              <span className="h-6 w-px bg-hair-2 mx-1" />
              <UserMenu name={user.name} email={user.email} role={user.role} />
            </div>
          </div>
        </header>
        <div className="px-8 py-7">{children}</div>
      </main>
    </div>
  );
}
