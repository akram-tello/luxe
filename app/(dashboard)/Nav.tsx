"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

type Item = {
  href: string;
  label: string;
  group: string;
  manager?: boolean;
};

const ITEMS: Item[] = [
  { href: "/manager", label: "Overview", group: "Workspace", manager: true },
  { href: "/associate", label: "My Day", group: "Workspace" },
  { href: "/clients", label: "Clients", group: "Journey" },
  { href: "/pipeline", label: "Pipeline", group: "Journey" },
  { href: "/tasks", label: "Tasks", group: "Journey" },
  { href: "/templates", label: "Templates", group: "Craft" },
  { href: "/reports", label: "Reports", group: "Craft", manager: true },
];

export function Nav({ role, overdueCount }: { role: UserRole; overdueCount: number }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => (i.manager ? role === "MANAGER" : true));
  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <nav className="flex-1 px-3 pb-4 overflow-y-auto">
      {groups.map((group) => (
        <div key={group} className="mb-5">
          <p className="px-4 py-2 text-[10px] uppercase tracking-wide-3 text-ink-4">
            {group}
          </p>
          <ul className="space-y-0.5">
            {items
              .filter((i) => i.group === group)
              .map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between px-4 h-9 rounded-xl text-[13px] font-medium transition-colors",
                        active
                          ? "bg-ink text-paper"
                          : "text-ink-2 hover:bg-ink/5 hover:text-ink",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "h-1 w-1 rounded-full transition-colors",
                            active ? "bg-paper" : "bg-ink-4 group-hover:bg-ink-2",
                          )}
                        />
                        {item.label}
                      </span>
                      {item.href === "/tasks" && overdueCount > 0 ? (
                        <span
                          className={cn(
                            "text-[10px] numeric px-1.5 h-5 inline-flex items-center rounded-full",
                            active
                              ? "bg-paper/15 text-paper"
                              : "bg-danger/10 text-danger",
                          )}
                        >
                          {overdueCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
