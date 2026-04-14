"use client";

import Image from "next/image";
import Link from "next/link";

export function SidebarLogo({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-4 mb-3 h-10 w-10 rounded-xl border border-hair-2 bg-paper flex items-center justify-center overflow-hidden hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      title="SWG Boutique"
    >
      <Image
        src="/brand/valiram-logo-light.avif"
        alt="Valiram"
        width={40}
        height={40}
        className="h-9 w-9 object-contain dark:hidden"
        priority
      />
      <Image
        src="/brand/valiram-logo-dark.jpg"
        alt="Valiram"
        width={40}
        height={40}
        className="h-10 w-10 object-cover hidden dark:block"
        priority
      />
    </Link>
  );
}
