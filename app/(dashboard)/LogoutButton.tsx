"use client";

import { useTransition } from "react";
import { logoutAction } from "./actions";

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => logoutAction())}
      className="h-8 w-8 rounded-full border border-hair-2 text-ink-3 hover:text-ink hover:border-ink/30 flex items-center justify-center disabled:opacity-40"
      disabled={pending}
      title={pending ? "Signing out…" : "Sign out"}
      aria-label="Sign out"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 14H3.5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 3.5 2H6" />
        <path d="M10 11l3-3-3-3" />
        <path d="M13 8H6" />
      </svg>
    </button>
  );
}
