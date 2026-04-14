"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Tab = { key: string; label: string; count?: number };

export function ClientTabs({
  tabs,
  panels,
  initial,
}: {
  tabs: Tab[];
  panels: Record<string, React.ReactNode>;
  initial?: string;
}) {
  const [active, setActive] = useState<string>(initial ?? tabs[0]?.key ?? "");
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h && tabs.some((t) => t.key === h)) {
        setActive(h);
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [tabs]);

  const select = (key: string) => {
    setActive(key);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#${key}`);
    }
  };

  return (
    <div ref={sectionRef} className="scroll-mt-24">
      <div className="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => select(t.key)}
            className={cn("tab", active === t.key && "tab-active")}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 ? (
              <span className={cn(
                "numeric text-[10px] px-1.5 h-4 rounded-full inline-flex items-center",
                active === t.key ? "bg-ink/10 text-ink" : "bg-ink/10 text-ink-3",
              )}>
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="mt-5">{panels[active]}</div>
    </div>
  );
}
