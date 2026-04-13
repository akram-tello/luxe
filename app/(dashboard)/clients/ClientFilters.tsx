"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PIPELINE_LABEL } from "@/lib/constants";

type Props = {
  initial: {
    q?: string;
    stage?: string;
    tier?: string;
  };
};

const STAGES = Object.entries(PIPELINE_LABEL);
const TIERS = ["STANDARD", "PRIORITY", "VIP"] as const;

export function ClientFilters({ initial }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initial.q ?? "");
  const [stage, setStage] = useState(initial.stage ?? "");
  const [tier, setTier] = useState(initial.tier ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    setOrDelete(next, "q", q);
    setOrDelete(next, "stage", stage);
    setOrDelete(next, "tier", tier);
    next.delete("page");
    router.push(`/clients?${next.toString()}`);
  }

  function reset() {
    setQ("");
    setStage("");
    setTier("");
    router.push("/clients");
  }

  return (
    <form onSubmit={apply} className="panel p-6 grid grid-cols-[2fr_1fr_1fr_auto_auto] gap-4 items-end">
      <div>
        <label className="label block mb-2">Search</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, phone, email"
          className="input"
        />
      </div>
      <div>
        <label className="label block mb-2">Stage</label>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="select">
          <option value="">All</option>
          {STAGES.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label block mb-2">Tier</label>
        <select value={tier} onChange={(e) => setTier(e.target.value)} className="select">
          <option value="">All</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <button className="btn-primary" type="submit">
        Apply
      </button>
      <button type="button" onClick={reset} className="btn-ghost">
        Reset
      </button>
    </form>
  );
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}
