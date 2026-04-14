"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
  manager?: boolean;
};

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ICONS = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  day: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  clients: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  pipeline: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="4" width="4" height="16" rx="1" />
      <rect x="10" y="4" width="4" height="10" rx="1" />
      <rect x="17" y="4" width="4" height="14" rx="1" />
    </svg>
  ),
  tasks: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  templates: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  ),
  reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const ITEMS: Item[] = [
  { href: "/manager", label: "Overview", icon: ICONS.overview, manager: true },
  { href: "/associate", label: "My Day", icon: ICONS.day },
  { href: "/clients", label: "Clients", icon: ICONS.clients },
  { href: "/pipeline", label: "Pipeline", icon: ICONS.pipeline },
  { href: "/tasks", label: "Tasks", icon: ICONS.tasks },
  { href: "/templates", label: "Templates", icon: ICONS.templates },
  { href: "/reports", label: "Reports", icon: ICONS.reports, manager: true },
  { href: "/settings/journey", label: "Journey settings", icon: ICONS.settings, manager: true },
];

export function Nav({ role, overdueCount }: { role: UserRole; overdueCount: number }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => (i.manager ? role === "MANAGER" : true));

  return (
    <nav className="flex-1 flex flex-col items-center py-3 gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const showBadge = item.href === "/tasks" && overdueCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              "group relative h-10 w-10 flex items-center justify-center rounded-xl transition-colors",
              active
                ? "bg-ink text-paper"
                : "text-ink-3 hover:bg-ink/[0.06] hover:text-ink",
            )}
          >
            {item.icon}
            {showBadge ? (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-danger text-chalk numeric text-[9px] font-semibold flex items-center justify-center ring-2 ring-paper">
                {overdueCount > 9 ? "9+" : overdueCount}
              </span>
            ) : null}
            <span
              className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 h-7 rounded-md bg-ink text-paper text-[11px] font-medium whitespace-nowrap flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-[60] shadow-soft ring-1 ring-gold/25"
              role="tooltip"
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
