"use client";

import Image from "next/image";
import Link from "next/link";
import swissLogo from "@/swiss-logo.png";

export function SidebarLogo({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-4 mb-3 h-10 w-10 rounded-xl border border-hair-2 bg-paper flex items-center justify-center overflow-hidden hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      title="Swiss Watch"
    >
      <Image
        src={swissLogo}
        alt="Swiss Watch"
        width={40}
        height={40}
        className="h-9 w-9 object-contain"
        priority
      />
    </Link>
  );
}
