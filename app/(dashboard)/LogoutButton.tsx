"use client";

import { useTransition } from "react";
import { logoutAction } from "./actions";

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => logoutAction())}
      className="mt-4 w-full text-[10px] uppercase tracking-widest text-bone/50 hover:text-bone transition-colors border border-line py-2"
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
