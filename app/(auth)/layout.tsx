export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden lg:flex relative overflow-hidden bg-ink text-paper">
        <div
          className="absolute inset-0 opacity-[0.08] dot-grid"
          aria-hidden
        />
        <div className="absolute -bottom-40 -right-40 w-[640px] h-[640px] rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-sage/15 blur-3xl" aria-hidden />
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full border border-paper/25 flex items-center justify-center">
              <span className="font-display text-[18px] leading-none">L</span>
            </div>
            <span className="eyebrow text-paper/70">Luxe · Geneva</span>
          </div>
          <div className="max-w-lg">
            <p className="eyebrow text-paper/60">The house ledger</p>
            <h1 className="mt-5 font-display text-[56px] leading-[1.02] tracking-tight-4 font-light text-balance">
              Every client remembered.<br />
              <span className="italic text-paper/70">Every promise kept.</span>
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed text-paper/60 max-w-md text-pretty">
              A single, audited source of truth for high-touch watch clienteling — from first greeting to five-year service.
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide-3 text-paper/40">
            <span>Authorised personnel only</span>
            <span>All activity audited</span>
          </div>
        </div>
      </aside>
      <main className="flex items-center justify-center px-6 py-16 lg:px-16">
        {children}
      </main>
    </div>
  );
}
