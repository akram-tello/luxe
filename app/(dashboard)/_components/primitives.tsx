import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-6 flex-wrap">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-1.5 font-display text-[38px] leading-[1.04] tracking-tight-1 font-normal text-balance">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-[13.5px] text-ink-3 max-w-xl">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHead({
  eyebrow,
  title,
  hint,
  action,
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-1 font-display text-[20px] leading-tight tracking-tight-1 font-medium">
          {title}
        </h2>
        {hint ? <p className="text-[12px] text-ink-3 mt-0.5">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
  trailing,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "danger" | "success";
  trailing?: React.ReactNode;
}) {
  const toneClass =
    tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-ink";
  return (
    <div className="surface p-5 flex flex-col justify-between gap-6 min-h-[132px]">
      <div className="flex items-start justify-between">
        <p className="eyebrow">{label}</p>
        {trailing}
      </div>
      <div>
        <p className={`font-display font-normal text-[34px] leading-none tracking-tight-2 ${toneClass}`}>
          {value}
        </p>
        {hint ? <p className="text-[12px] text-ink-3 mt-1.5">{hint}</p> : null}
      </div>
    </div>
  );
}

export function LinkCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-ink underline-offset-4 hover:underline"
    >
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-10 px-6 text-center text-ink-3 text-[13px]">{children}</div>
  );
}
