import Image from "next/image";

export function WelcomeBanner({
  name,
  role,
}: {
  name: string;
  role: "MANAGER" | "ASSOCIATE";
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-chalk via-chalk to-gold/10 shadow-soft">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl"
        aria-hidden
      />
      <div className="relative grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 items-center p-8">
        <div>
          <p className="eyebrow text-gold-deep dark:text-gold-soft">
            Valiram · 1935–2025
          </p>
          <h2 className="mt-3 font-display text-[30px] leading-[1.08] tracking-tight-1 text-balance">
            Welcome back, <span className="italic">{name.split(" ")[0]}</span>.
          </h2>
          <p className="mt-3 text-[13.5px] text-ink-2 leading-relaxed max-w-lg">
            {role === "MANAGER"
              ? "Ninety years of retail heritage on the floor today. Every client remembered, every promise kept."
              : "Your clients, your craft. Move the journey forward with intention."}
          </p>
        </div>
        <div className="flex justify-end">
          <Image
            src="/brand/valiram-90-great-years.webp"
            alt="Valiram — 90 Great Years, 1935–2025"
            width={320}
            height={180}
            className="w-full max-w-[280px] h-auto object-contain dark:brightness-110"
            priority
          />
        </div>
      </div>
    </section>
  );
}
