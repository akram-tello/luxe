"use client";

import { useEffect, useRef, useState } from "react";
import { initials } from "@/lib/utils/format";
import { LogoutButton } from "./LogoutButton";

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: "MANAGER" | "ASSOCIATE";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-1 pr-3 h-9 rounded-full border border-hair-2 bg-chalk hover:border-ink/30"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="initial-badge h-7 w-7 text-[11px]">{initials(name)}</span>
        <span className="text-[12.5px] text-ink font-medium tracking-tight-2 hidden sm:inline">
          {name.split(" ")[0]}
        </span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3">
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-60 surface-raised p-1.5 z-40"
        >
          <div className="px-3 py-2.5 border-b border-hair">
            <p className="text-[13px] font-medium text-ink truncate">{name}</p>
            <p className="text-[11px] text-ink-3 truncate mt-0.5">{email}</p>
            <p className="text-[10px] uppercase tracking-wide-3 text-ink-4 mt-1.5">
              {role === "MANAGER" ? "Manager" : "Associate"}
            </p>
          </div>
          <div className="pt-1">
            <LogoutButton variant="menu" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
