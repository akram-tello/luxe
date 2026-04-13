"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

type Item = {
  href: string;
  label: string;
  manager?: boolean;
};

const ITEMS: Item[] = [
  { href: "/manager", label: "Overview", manager: true },
  { href: "/associate", label: "My Day" },
  { href: "/clients", label: "Clients" },
  { href: "/tasks", label: "Tasks" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/templates", label: "Templates" },
  { href: "/reports", label: "Reports", manager: true },
];

export function Nav({ role, overdueCount }: { role: UserRole; overdueCount: number }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => (i.manager ? role === "MANAGER" : true));

  return (
    <nav className="flex-1 py-6">
      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-8 py-3 text-sm uppercase tracking-wider transition-colors border-l-2",
                  active
                    ? "border-gold text-bone bg-ink/60"
                    : "border-transparent text-bone/60 hover:text-bone hover:bg-ink/40",
                )}
              >
                <span>{item.label}</span>
                {item.href === "/tasks" && overdueCount > 0 ? (
                  <span className="text-[10px] text-danger">{overdueCount}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
