"use client";

import { useTransition } from "react";
import { logoutAction } from "./actions";

export function LogoutButton({ variant = "rail" }: { variant?: "rail" | "menu" }) {
  const [pending, start] = useTransition();

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={() => start(() => logoutAction())}
        className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[12.5px] text-ink-2 hover:bg-ink/5 hover:text-ink disabled:opacity-40"
        disabled={pending}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 14H3.5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 3.5 2H6" />
          <path d="M10 11l3-3-3-3" />
          <path d="M13 8H6" />
        </svg>
        {pending ? "Signing out…" : "Sign out"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => start(() => logoutAction())}
      className="h-10 w-10 flex items-center justify-center rounded-xl text-ink-3 hover:bg-ink/[0.06] hover:text-ink disabled:opacity-40"
      disabled={pending}
      title={pending ? "Signing out…" : "Sign out"}
      aria-label="Sign out"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 14H3.5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 3.5 2H6" />
        <path d="M10 11l3-3-3-3" />
        <path d="M13 8H6" />
      </svg>
    </button>
  );
}
