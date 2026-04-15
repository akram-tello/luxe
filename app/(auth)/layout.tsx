import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden lg:flex relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 opacity-[0.08] dot-grid" aria-hidden />
        <div
          className="absolute -bottom-40 -right-40 w-[640px] h-[640px] rounded-full bg-gold/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gold/10 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/valiram-logo-dark.jpg"
              alt="Valiram"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border border-paper/15 object-cover"
              priority
            />
            <span className="eyebrow text-paper/70">Valiram · SWG Boutique</span>
          </div>

          <div className="max-w-lg flex flex-col items-start gap-8">
            <Image
              src="/brand/valiram-90-great-years.webp"
              alt="90 Great Years — 1935–2025"
              width={440}
              height={260}
              className="w-[340px] h-auto opacity-95"
              priority
            />
            <div>
              <p className="eyebrow text-gold/90">Ninety years of retail</p>
              <h1 className="mt-4 font-display text-[48px] leading-[1.04] tracking-tight-4 text-gold/90 text-balance">
                Every client remembered.
                <br />
                <span className="italic text-paper/70">Every promise kept.</span>
              </h1>
              <p className="mt-5 text-[15px] leading-relaxed text-paper/60 max-w-md text-pretty">
                A single, audited source of truth for high-touch Valiram
                clienteling — from first greeting to lifetime service.
              </p>
            </div>
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
